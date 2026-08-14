import { NextResponse } from "next/server";

import { generatePlanStub } from "@/lib/ai/gemini";
import { isHttpError } from "@/lib/errors/http-error";

export async function POST() {
  try {
    const result = await generatePlanStub();

    return NextResponse.json(
      {
        data: result,
      },
      { status: result.mock ? 503 : 200 },
    );
  } catch (error) {
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
          message: "Unexpected error while generating plan stub.",
        },
      },
      { status: 500 },
    );
  }
}
