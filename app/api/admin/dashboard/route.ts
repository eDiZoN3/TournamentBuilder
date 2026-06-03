import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboardMetrics";
import { jsonError } from "@/lib/api";

export async function GET() {
  if (!(await requireAdmin())) {
    return jsonError("Authentication required", "UNAUTHORIZED", 401);
  }

  try {
    return NextResponse.json({
      metrics: await getAdminDashboardMetrics(),
    });
  } catch {
    return jsonError("Unable to load dashboard metrics", "INTERNAL_ERROR", 500);
  }
}
