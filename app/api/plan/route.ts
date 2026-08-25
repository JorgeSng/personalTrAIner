import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { isHttpError } from "@/lib/errors/http-error";
import { getActivePlan } from "@/lib/plans/get-active-plan";

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

export async function GET() {
  try {
    const user = await requireUser();
    const plan = await getActivePlan(user.id);
    return NextResponse.json({ data: plan });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while reading workout plan.");
  }
}
