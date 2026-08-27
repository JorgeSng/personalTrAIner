import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { requireUser } from "@/lib/auth/session";
import { HttpError, isHttpError } from "@/lib/errors/http-error";
import { createSession } from "@/lib/sessions/create-session";
import { listSessions } from "@/lib/sessions/list-sessions";
import {
  workoutSessionCreateSchema,
  workoutSessionListQuerySchema,
} from "@/lib/validation/schemas/workout-session";

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

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid JSON body.");
  }
}

function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request.",
    );
  }

  return parsed.data;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const query = parseWithSchema(workoutSessionListQuerySchema, {
      plan_id: url.searchParams.get("plan_id") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const data = await listSessions(user.id, {
      plan_id: query.plan_id,
      limit: query.limit ?? 20,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while listing sessions.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = parseWithSchema(
      workoutSessionCreateSchema,
      await readJsonBody(request),
    );
    const data = await createSession(user.id, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while creating session.");
  }
}
