import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function jsonError(
  error: string,
  code: ApiErrorCode,
  status: number,
) {
  return NextResponse.json(
    {
      error,
      code,
    },
    {
      status,
    },
  );
}

