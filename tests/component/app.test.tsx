import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

describe("P-04 / A11Y-01 guided workflow", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/demo?fixture=FIX-DEMO-FIXED");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("preserves start focus, returns approval focus to composer, and focuses review only on request", async () => {
    render(<App />);
    const run = screen.getByRole("button", { name: "Run fixed fixture" });
    run.focus();
    fireEvent.click(run);
    expect(run).toHaveFocus();
    for (let index = 0; index < 4; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(100));
    }
    const approve = screen.getByRole("button", {
      name: "Approve synthetic log access once",
    });
    approve.focus();
    fireEvent.click(approve);
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(screen.getByLabelText("Synthetic composer")).toHaveFocus();
    for (let index = 0; index < 4; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(100));
    }
    const heading = screen.getByRole("heading", {
      name: "Review local observable evidence",
    });
    expect(heading).not.toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Review result" }));
    expect(heading).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Reset review" }));
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(run).toHaveFocus();
  });

  it("moves broken-review rerun focus to the persistent run control before unmount", async () => {
    window.history.replaceState({}, "", "/demo?fixture=FIX-DEMO-BROKEN");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Run broken fixture" }));
    for (let index = 0; index < 4; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(100));
    }
    fireEvent.click(
      screen.getByRole("button", {
        name: "Approve synthetic log access once",
      }),
    );
    for (let index = 0; index < 10; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(100));
    }

    const rerun = screen.getByRole("button", { name: "Run fixed fixture" });
    rerun.focus();
    fireEvent.click(rerun, { detail: 0 });

    const stableRun = screen.getByRole("button", {
      name: "Run fixed fixture",
    });
    expect(stableRun).toHaveFocus();
    await act(async () => vi.advanceTimersByTimeAsync(0));
    for (let index = 0; index < 4; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(100));
    }
    expect(stableRun).toHaveFocus();

    const approval = screen.getByRole("button", {
      name: "Approve synthetic log access once",
    });
    approval.focus();
    fireEvent.click(approval);
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(screen.getByLabelText("Synthetic composer")).toHaveFocus();
    for (let index = 0; index < 4; index += 1) {
      await act(async () => vi.advanceTimersByTimeAsync(100));
    }

    const heading = screen.getByRole("heading", {
      name: "Review local observable evidence",
    });
    expect(heading).not.toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Review result" }));
    expect(heading).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Reset review" }));
    await act(async () => vi.advanceTimersByTimeAsync(20));
    expect(stableRun).toHaveFocus();
  });
});
