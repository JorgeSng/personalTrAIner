import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { requireUser } from "@/lib/auth/session";
import { HttpError, isHttpError } from "@/lib/errors/http-error";
import { createClient } from "@/lib/supabase/server";
import {
  profilePatchSchema,
  profileSchema,
} from "@/lib/validation/schemas/profile";

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

function parseWithSchema<T>(schema: ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request body.",
    );
  }

  return parsed.data;
}

function isUniqueViolation(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "23505" ||
    /duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw new HttpError(
        500,
        "INTERNAL_ERROR",
        "Unexpected error while reading profile.",
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while reading profile.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = parseWithSchema(profileSchema, await readJsonBody(request));
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .insert({ ...body, user_id: user.id })
      .select("*")
      .single();

    if (isUniqueViolation(error)) {
      throw new HttpError(
        409,
        "CONFLICT",
        "A profile already exists for this user.",
      );
    }

    if (error || !data) {
      throw new HttpError(
        500,
        "INTERNAL_ERROR",
        "Unexpected error while creating profile.",
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while creating profile.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = parseWithSchema(profilePatchSchema, await readJsonBody(request));
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(body)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new HttpError(
        500,
        "INTERNAL_ERROR",
        "Unexpected error while updating profile.",
      );
    }

    if (!data) {
      throw new HttpError(404, "NOT_FOUND", "Profile not found.");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error, "Unexpected error while updating profile.");
  }
}
