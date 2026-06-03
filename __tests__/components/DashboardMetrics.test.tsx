// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";

describe("DashboardMetrics", () => {
  it("renders the admin overview metrics", () => {
    render(
      <DashboardMetrics
        metrics={{
          playedMatches: 42,
          registeredAdmins: 2,
          registeredPlayers: 18,
          registeredTournaments: 5,
          tournamentsByStatus: {
            active: 1,
            completed: 3,
            draft: 1,
          },
        }}
      />,
    );

    expect(screen.getByText("Registered players")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Registered admins")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Registered tournaments")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Played matches")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("1 draft / 1 active / 3 completed")).toBeInTheDocument();
  });
});
