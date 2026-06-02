// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ToastProvider,
  useToast,
} from "@/components/ui/Toast";

function ToastHarness() {
  const { showToast } = useToast();

  return (
    <button
      onClick={() =>
        showToast({
          message: "Score saved.",
          title: "Saved",
          type: "success",
        })
      }
      type="button"
    >
      Show toast
    </button>
  );
}

describe("Toast", () => {
  it("renders a toast and auto-dismisses it after five seconds", () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.getByText("Score saved.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Score saved.")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("lets users dismiss visible toasts", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Saved" }));

    expect(screen.queryByText("Score saved.")).not.toBeInTheDocument();
  });
});

describe("ErrorBanner", () => {
  it("renders a dismissible non-blocking error message", () => {
    render(<ErrorBanner message="Unable to refresh" />);

    expect(screen.getByRole("status")).toHaveTextContent("Unable to refresh");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss error" }));

    expect(screen.queryByText("Unable to refresh")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title, description, and an optional action", () => {
    render(
      <EmptyState
        action={<a href="/admin/tournament/new">Create tournament</a>}
        description="Create one to start scheduling matches."
        title="No tournaments yet."
      />,
    );

    expect(screen.getByRole("heading", { name: "No tournaments yet." })).toBeInTheDocument();
    expect(
      screen.getByText("Create one to start scheduling matches."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create tournament" })).toHaveAttribute(
      "href",
      "/admin/tournament/new",
    );
  });
});

describe("Skeleton", () => {
  it("renders an animated placeholder with caller-provided sizing", () => {
    render(<Skeleton className="h-4 w-24" data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton")).toHaveClass(
      "animate-pulse",
      "h-4",
      "w-24",
    );
  });
});
