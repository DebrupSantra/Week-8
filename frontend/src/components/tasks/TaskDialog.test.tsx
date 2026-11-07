import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskDialog } from "./TaskDialog";

describe("TaskDialog", () => {
  it("validates required fields before saving", async () => {
    const onSave = vi.fn();
    render(<TaskDialog onClose={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Enter a task title.")).toBeInTheDocument();
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  it("submits a valid new task", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TaskDialog onClose={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Prepare release notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: "Prepare release notes",
        description: null,
        status: "TODO",
        priority: "MEDIUM",
        dueDate: null,
      });
    });
  });
});
