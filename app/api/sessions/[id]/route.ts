import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { HttpError, isHttpError } from "@/lib/errors/http-error";
import { getSessionById } from "@/lib/sessions/get-session-by-id";

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

const sessionIdSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parsedId = sessionIdSchema.safeParse(id);

    if (!parsedId.success) {
      throw new HttpError(
        400,
        "VALIDATION_ERROR",
        parsedId.error.issues[0]?.message ?? "Invalid session id.",
      );
    }

    const data = await getSessionById(user.id, parsedId.data);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while reading session.");
  }
}
