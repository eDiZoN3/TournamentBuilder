import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "STALE_TOURNAMENT"
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
