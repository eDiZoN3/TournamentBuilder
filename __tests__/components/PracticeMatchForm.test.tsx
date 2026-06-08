// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeMatchForm } from "@/components/player/PracticeMatchForm";

describe("PracticeMatchForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults the current player and blocks invalid scores", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        players: [
          {
            _id: "opponent-id",
            displayName: "Bob Builder",
            firstName: "Bob",
            surname: "Builder",
          },
        ],
      }),
    } as Response);
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
    fireEvent.click(await screen.findByRole("button", { name: "Bob Builder" }));
    fireEvent.change(screen.getByLabelText("Your score"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Opponent score"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save practice match" }));

    expect(await screen.findByText(/lead by at least 2/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/practice-matches",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("submits a valid practice match to the API", async () => {
    const onSaved = vi.fn();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          players: [
            {
              _id: "opponent-id",
              displayName: "Bob Builder",
              firstName: "Bob",
              surname: "Builder",
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          match: {
            _id: "match-id",
            createdBy: "profile-id",
            playedAt: "2026-06-06T12:00:00.000Z",
            sideA: [{ playerProfileId: "profile-id", displayName: "Alice Example" }],
            sideB: [{ playerProfileId: "opponent-id", displayName: "Bob Builder" }],
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
    fireEvent.click(await screen.findByRole("button", { name: "Bob Builder" }));
    fireEvent.change(screen.getByLabelText("Your score"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Opponent score"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save practice match" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/player-profiles?q=Bob",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice-matches",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      sideA: [{ playerProfileId: "profile-id", displayName: "Alice Example" }],
      sideB: [{ playerProfileId: "opponent-id", displayName: "Bob Builder" }],
      sets: [{ scoreA: 11, scoreB: 8 }],
    });
  });

  it("prevents selecting the current player as the opponent", async () => {
    const onSaved = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        players: [
          {
            _id: "profile-id",
            displayName: "Alice Example",
            firstName: "Alice",
          },
        ],
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
      target: { value: "Alice" },
    });

    expect(await screen.findByText("This player is already selected.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Alice Example" }),
    ).not.toBeInTheDocument();
  });
});
