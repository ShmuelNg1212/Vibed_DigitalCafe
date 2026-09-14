import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("login form", () => {
  it("shows a network error and clears pending state when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "customer@digitalcafe.local" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "digitalcafe-demo" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Could not reach the sign-in service/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled());
  });
});
