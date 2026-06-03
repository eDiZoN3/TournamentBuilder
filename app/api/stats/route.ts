import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Tournament, type ITournament } from "@/lib/models/Tournament";
import { aggregateStats } from "@/lib/stats";

export async function GET() {
  try {
    await connectDB();

    const tournaments = await Tournament.find().lean();

    return NextResponse.json(
      aggregateStats(JSON.parse(JSON.stringify(tournaments)) as ITournament[]),
    );
  } catch {
    return jsonError("Unable to load stats", "INTERNAL_ERROR", 500);
  }
}
