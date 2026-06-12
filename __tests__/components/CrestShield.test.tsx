// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrestShield } from "@/components/bracket/CrestShield";
import {
  CREST_CHARGES,
  CREST_DIVISIONS,
  type TeamCrest,
} from "@/lib/crest";

const baseCrest: TeamCrest = {
  field: "blue",
  division: "plain",
  divisionColor: "gold",
  charge: "cross",
  chargeColor: "silver",
};

describe("CrestShield", () => {
  it("renders every supported division", () => {
    for (const division of CREST_DIVISIONS) {
      const { container, unmount } = render(
        <CrestShield
          crest={{
            ...baseCrest,
            division,
          }}
          size={32}
          title={`${division} shield`}
        />,
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: `${division} shield` }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("renders every supported charge", () => {
    for (const charge of CREST_CHARGES) {
      const { container, unmount } = render(
        <CrestShield
          crest={{
            ...baseCrest,
            charge,
          }}
          size={28}
        />,
      );

      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      unmount();
    }
  });

  it("renders animal charges as color emoji", () => {
    const { container } = render(
      <CrestShield
        crest={{
          ...baseCrest,
          charge: "lion",
        }}
        size={32}
      />,
    );

    const emoji = container.querySelector("text");
    expect(emoji).toHaveTextContent("🦁");
    expect(emoji).toHaveAttribute("stroke", "none");
  });

  it("ignores unknown division and charge ids without failing", () => {
    const { container } = render(
      <CrestShield
        crest={
          {
            ...baseCrest,
            division: "unknown",
            charge: "unknown",
          } as TeamCrest
        }
      />,
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
