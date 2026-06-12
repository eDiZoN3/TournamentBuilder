// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CrestEditor } from "@/components/bracket/CrestEditor";
import type { TeamCrest } from "@/lib/crest";

const initialCrest: TeamCrest = {
  field: "blue",
  division: "plain",
  divisionColor: "gold",
  charge: "cross",
  chargeColor: "silver",
};

function renderEditor(
  options: {
    onClose?: () => void;
    onSaved?: () => void | Promise<void>;
  } = {},
) {
  return render(
    <CrestEditor
      initialCrest={initialCrest}
      onClose={options.onClose ?? vi.fn()}
      onSaved={options.onSaved ?? vi.fn()}
      teamId="team-id"
      teamName="Alpha"
      tournamentId="tournament-id"
    />,
  );
}

describe("CrestEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("edits crest fields and saves the selected crest", async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    renderEditor({ onClose, onSaved });

    fireEvent.click(screen.getAllByRole("button", { name: "red" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "perFess" }));
    fireEvent.click(screen.getByRole("button", { name: "mullet" }));
    fireEvent.click(screen.getByRole("button", { name: "Save coat of arms" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tournaments/tournament-id/teams/team-id/crest",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            field: "red",
            division: "perFess",
            divisionColor: "gold",
            charge: "mullet",
            chargeColor: "silver",
          }),
        }),
      );
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("keeps inside clicks in the dialog and closes from backdrop or cancel", () => {
    const onClose = vi.fn();
    const firstRender = renderEditor({ onClose });

    fireEvent.click(screen.getByText("Alpha"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    firstRender.unmount();

    onClose.mockClear();
    renderEditor({ onClose });
    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("randomizes the crest and keeps the editor open when saving fails", async () => {
    const onClose = vi.fn();
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    const fetch = vi.fn().mockRejectedValue(new Error("Network down"));
    vi.stubGlobal("fetch", fetch);
    renderEditor({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Randomize" }));
    fireEvent.click(screen.getByRole("button", { name: "Save coat of arms" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
    random.mockRestore();
  });
});
