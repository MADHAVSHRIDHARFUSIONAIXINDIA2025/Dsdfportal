import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, getErrorMessage } from "@/lib/errors";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message || "Validation failed" }, { status: 400 });
  }
  const status = error instanceof AppError ? error.status : 500;
  const message = getErrorMessage(error);
  return NextResponse.json({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError("Invalid JSON body");
  }
}
