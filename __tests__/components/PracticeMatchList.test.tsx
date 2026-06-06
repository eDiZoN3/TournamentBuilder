// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeMatchList } from "@/components/player/PracticeMatchList";

const match = {
  _id: "match-id",
  createdBy: "profile-id",
  playedAt: "2026-06-06T12:00:00.000Z",
  sideA: [{ playerProfileId: "profile-id", displayName: "Alice" }],
  sideB: [{ displayName: "Bob" }],
  sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 as const }],
  winnerSide: "A" as const,
};

describe("PracticeMatchList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders practice match results and exposes edit", () => {
    const onEdit = vi.fn();

    render(
      <PracticeMatchList
        currentPlayerProfileId="profile-id"
        matches={[match]}
        onDeleted={vi.fn()}
        onEdit={onEdit}
      />,
    );

    expect(screen.getByText("Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByText("11:8")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(match);
  });

  it("deletes creator-owned practice matches", async () => {
    const onDeleted = vi.fn();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ deleted: true }),
    } as Response);

    render(
      <PracticeMatchList
        currentPlayerProfileId="profile-id"
        matches={[match]}
        onDeleted={onDeleted}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("match-id"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice-matches/match-id",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
