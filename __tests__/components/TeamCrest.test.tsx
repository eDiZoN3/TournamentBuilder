// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeTeams } from "@/__tests__/helpers/factories";
import { CrestProvider } from "@/components/bracket/CrestContext";
import { TeamCrest } from "@/components/bracket/TeamCrest";
import type { ITeam } from "@/lib/models/Tournament";

function renderCrest(
  options: { active: boolean; editable?: boolean },
  teams: ITeam[],
) {
  return render(
    <CrestProvider
      active={options.active}
      editable={options.editable}
      teams={teams}
      tournamentId="t1"
    >
      <TeamCrest teamId={teams[0]._id} />
    </CrestProvider>,
  );
}

describe("TeamCrest", () => {
  const teams = makeTeams(2) as unknown as ITeam[];

  it("renders nothing when the theme is not the knight theme", () => {
    const { container } = renderCrest({ active: false }, teams);

    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders nothing when the team is unknown", () => {
    const { container } = render(
      <CrestProvider active teams={[]} tournamentId="t1">
        <TeamCrest teamId={teams[0]._id} />
      </CrestProvider>,
    );

    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a non-interactive shield in display mode", () => {
    renderCrest({ active: true, editable: false }, teams);

    expect(screen.getByRole("img", { name: "Coat of arms" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit coat of arms" }),
    ).not.toBeInTheDocument();
  });

  it("exposes an edit affordance when editing is allowed", () => {
    renderCrest({ active: true, editable: true }, teams);

    expect(
      screen.getByRole("button", { name: "Edit coat of arms" }),
    ).toBeInTheDocument();
  });

  it("resolves a team by name (as the stats table does)", () => {
    render(
      <CrestProvider active teams={teams} tournamentId="t1">
        <TeamCrest teamName={teams[0].name} />
      </CrestProvider>,
    );

    expect(screen.getByRole("img", { name: "Coat of arms" })).toBeInTheDocument();
  });
});
