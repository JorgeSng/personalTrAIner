import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { HttpError, isHttpError } from "@/lib/errors/http-error";
import { generateAndPersistPlan } from "@/lib/plans/generate-and-persist";

const emptyBodySchema = z.object({}).strict();

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (isHttpError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: fallbackMessage,
      },
    },
    { status: 500 },
  );
}

async function assertEmptyBody(request: Request): Promise<void> {
  const text = await request.text();

  if (!text || text.trim() === "") {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid JSON body.");
  }

  const result = emptyBodySchema.safeParse(parsed);
  if (!result.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Request body must be empty or {}.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await assertEmptyBody(request);
    const plan = await generateAndPersistPlan(user.id);
    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    return toErrorResponse(
      error,
      "Unexpected error while generating workout plan.",
    );
  }
}
