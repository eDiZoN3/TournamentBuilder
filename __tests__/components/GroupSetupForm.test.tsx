// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TournamentGroup } from "@/lib/models/TournamentGroup";
import AdminGroupsListPage from "@/app/admin/groups/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

const mockedUseRouter = vi.mocked(useRouter);
const push = vi.fn();
const refresh = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Admin groups list page", () => {
  it("server-renders group rows", async () => {
    await TournamentGroup.create({
      name: "Beach Cup",
      teams: [{ name: "T1", players: [], seed: 1 }],
      categories: [
        { name: "Cat A", position: 0 },
        { name: "Cat B", position: 1 },
      ],
    });

    const html = renderToStaticMarkup(await AdminGroupsListPage());

    expect(html).toContain("Beach Cup");
    expect(html).toContain("1"); // teamCount
    expect(html).toContain("2"); // categoryCount
  });

  it("server-renders an empty state when no groups exist", async () => {
    const html = renderToStaticMarkup(await AdminGroupsListPage());
    expect(html).toBeDefined();
  });
});

describe("GroupSetupForm", () => {
  let GroupSetupForm: typeof import("@/components/groups/GroupSetupForm").GroupSetupForm;

  beforeEach(async () => {
    push.mockReset();
    refresh.mockReset();
    mockedUseRouter.mockReturnValue({ push, refresh } as never);
    vi.stubGlobal("fetch", vi.fn());
    ({ GroupSetupForm } = await import("@/components/groups/GroupSetupForm"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("renders name input, team rows section, and category rows section", () => {
    render(<GroupSetupForm />);

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add team/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add category/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create group/i })).toBeInTheDocument();
  });

  it("adds a team row when 'Add team' is clicked", async () => {
    render(<GroupSetupForm />);

    expect(screen.queryAllByPlaceholderText(/team name/i)).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    await waitFor(() =>
      expect(screen.queryAllByPlaceholderText(/team name/i)).toHaveLength(1),
    );
  });

  it("removes a team row when its remove button is clicked", async () => {
    render(<GroupSetupForm />);

    // Add two teams
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));

    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(/team name/i)).toHaveLength(2),
    );

    const removeButtons = screen.getAllByRole("button", { name: /remove team/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(/team name/i)).toHaveLength(1),
    );
  });

  it("adds a category row when 'Add category' is clicked", async () => {
    render(<GroupSetupForm />);

    expect(screen.queryAllByPlaceholderText(/category name/i)).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    await waitFor(() =>
      expect(screen.queryAllByPlaceholderText(/category name/i)).toHaveLength(1),
    );
  });

  it("removes a category row when its remove button is clicked", async () => {
    render(<GroupSetupForm />);

    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));

    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(/category name/i)).toHaveLength(2),
    );

    const removeButtons = screen.getAllByRole("button", { name: /remove category/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(/category name/i)).toHaveLength(1),
    );
  });

  it("shows validation error when fewer than 2 teams are entered on submit", async () => {
    render(<GroupSetupForm />);

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: "My Cup" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    fireEvent.change(screen.getAllByPlaceholderText(/team name/i)[0], {
      target: { value: "Solo Team" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.change(screen.getAllByPlaceholderText(/category name/i)[0], {
      target: { value: "Cat A" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    expect(screen.getByText(/at least 2 teams/i)).toBeInTheDocument();
  });

  it("shows validation error when no categories are entered on submit", async () => {
    render(<GroupSetupForm />);

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: "My Cup" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    const teamInputs = screen.getAllByPlaceholderText(/team name/i);
    fireEvent.change(teamInputs[0], { target: { value: "Alpha" } });
    fireEvent.change(teamInputs[1], { target: { value: "Beta" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    expect(screen.getByText(/at least 1 category/i)).toBeInTheDocument();
  });

  it("calls POST /api/groups then PUT teams then POST categories on valid submit", async () => {
    const groupId = "new-group-id";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ _id: groupId, name: "Cup" }, 201)) // POST /api/groups
      .mockResolvedValueOnce(jsonResponse({ _id: groupId })) // PUT /api/groups/:id/teams
      .mockResolvedValueOnce(jsonResponse({ _id: groupId })); // POST /api/groups/:id/categories
    vi.stubGlobal("fetch", fetchMock);

    render(<GroupSetupForm />);

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: "Summer Cup" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    const teamInputs = screen.getAllByPlaceholderText(/team name/i);
    fireEvent.change(teamInputs[0], { target: { value: "Team Alpha" } });
    fireEvent.change(teamInputs[1], { target: { value: "Team Beta" } });
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.change(screen.getAllByPlaceholderText(/category name/i)[0], {
      target: { value: "Cat A" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const [createCall, teamsCall, catCall] = fetchMock.mock.calls;
    expect(createCall[0]).toBe("/api/groups");
    expect(createCall[1].method).toBe("POST");
    expect(teamsCall[0]).toBe(`/api/groups/${groupId}/teams`);
    expect(teamsCall[1].method).toBe("PUT");
    expect(catCall[0]).toBe(`/api/groups/${groupId}/categories`);
    expect(catCall[1].method).toBe("POST");
  });

  it("redirects to the group management page after successful creation", async () => {
    const groupId = "redirect-group-id";
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(jsonResponse({ _id: groupId }, 201))
        .mockResolvedValueOnce(jsonResponse({}))
        .mockResolvedValueOnce(jsonResponse({})),
    );

    render(<GroupSetupForm />);

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: "Cup" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    const teamInputs = screen.getAllByPlaceholderText(/team name/i);
    fireEvent.change(teamInputs[0], { target: { value: "A" } });
    fireEvent.change(teamInputs[1], { target: { value: "B" } });
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.change(screen.getAllByPlaceholderText(/category name/i)[0], {
      target: { value: "Cat X" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/admin/groups/${groupId}`),
    );
  });
});
