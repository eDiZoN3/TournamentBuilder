// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeMatchForm } from "@/components/player/PracticeMatchForm";

describe("PracticeMatchForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults the current player and blocks invalid scores", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const onSaved = vi.fn();

    render(
      <PracticeMatchForm
        currentPlayer={{
          playerProfileId: "profile-id",
          displayName: "Alice Example",
        }}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByDisplayValue("Alice Example")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Opponent name"), {
      target: { value: "Bob" },
    });
    fireEvent.change(screen.getByLabelText("Your score"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Opponent score"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save practice match" }));

    expect(await screen.findByText(/lead by at least 2/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a valid practice match to the API", async () => {
    const onSaved = vi.fn();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        match: {
          _id: "match-id",
          createdBy: "profile-id",
          playedAt: "2026-06-06T12:00:00.000Z",
          sideA: [{ playerProfileId: "profile-id", displayName: "Alice Example" }],
          sideB: [{ displayName: "Bob" }],
          sets: [{ scoreA: 11, scoreB: 8, pointsToWin: 11 }],
          winnerSide: "A",
        },
      }),
    } as Response);

    render(
      <PracticeMatchForm
        currentPlayer={{
          playerProfileId: "profile-id",
          displayName: "Alice Example",
        }}
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByLabelText("Opponent name"), {
      target: { value: "Bob" },
    });
    fireEvent.change(screen.getByLabelText("Your score"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Opponent score"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save practice match" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice-matches",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      sideA: [{ playerProfileId: "profile-id", displayName: "Alice Example" }],
      sideB: [{ displayName: "Bob" }],
      sets: [{ scoreA: 11, scoreB: 8 }],
    });
  });
});
