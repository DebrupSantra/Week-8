import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPage } from "./AuthPage";

const { login, register } = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock("../store/authStore", () => ({
  useAuthStore: (selector: (state: { login: typeof login; register: typeof register }) => unknown) =>
    selector({ login, register }),
}));

describe("AuthPage", () => {
  beforeEach(() => {
    login.mockReset();
    register.mockReset();
  });

  it("shows field validation and does not submit invalid credentials", async () => {
    render(
      <MemoryRouter>
        <AuthPage mode="login" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(await screen.findByText("Use at least 8 characters.")).toBeInTheDocument();
    await waitFor(() => expect(login).not.toHaveBeenCalled());
  });

  it("validates the full name for registration", async () => {
    render(
      <MemoryRouter>
        <AuthPage mode="register" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alex@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "long-enough-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
