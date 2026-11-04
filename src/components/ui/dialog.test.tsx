import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";

describe("Dialog primitive", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders when open and has accessible dialog attributes", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description for accessibility</DialogDescription>
          </DialogHeader>
          <div>Dialog Body Content</div>
          <DialogFooter>
            <button type="button">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog Title")).toBeInTheDocument();
    expect(screen.getByText("Dialog description for accessibility")).toBeInTheDocument();
    expect(screen.getByText("Dialog Body Content")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden Title")).not.toBeInTheDocument();
  });
});
