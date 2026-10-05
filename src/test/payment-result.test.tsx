import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PaymentResult from "@/pages/PaymentResult";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
const id = "628c0721-bd00-4000-8000-000000000001";
const result = (status: string) => ({ data: { order_number: "MBM-TEST", total: 650, payment_status: status }, error: null });
function mount(outcome: "success" | "cancelled" = "success", query = `?order=${id}`) {
  return render(<MemoryRouter initialEntries={[`/payment/${outcome}${query}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PaymentResult outcome={outcome} /></MemoryRouter>);
}
beforeEach(() => { invoke.mockReset(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("payment return confirmation", () => {
  it("continues checking beyond the old 20-second window and confirms only a DB-paid response", async () => {
    invoke.mockResolvedValue(result("pending"));
    mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(screen.getByText("Confirming payment")).toBeInTheDocument();
    expect(screen.queryByText("Payment received")).not.toBeInTheDocument();
    invoke.mockResolvedValue(result("paid"));
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.getByText("Payment received")).toBeInTheDocument();
    const calls = invoke.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(invoke).toHaveBeenCalledTimes(calls);
  });

  it("ends a pending wait honestly and supports an explicit recheck", async () => {
    invoke.mockResolvedValue(result("pending"));
    mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(120000); });
    expect(screen.getByText("Payment confirmation pending.")).toBeInTheDocument();
    expect(screen.queryByText("Thank you for your order.")).not.toBeInTheDocument();
    invoke.mockResolvedValue(result("paid"));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Check payment again" })); });
    expect(screen.getByText("Payment received")).toBeInTheDocument();
  });

  it("uses the DB even when the return URL says cancelled", async () => {
    invoke.mockResolvedValue(result("paid"));
    await act(async () => { mount("cancelled"); });
    expect(screen.getByText("Payment received")).toBeInTheDocument();
    expect(screen.queryByText(/No money was taken/)).not.toBeInTheDocument();
  });

  it.each(["failed", "cancelled"])("shows the actual %s state on the success URL", async (status) => {
    invoke.mockResolvedValue(result(status));
    await act(async () => { mount(); });
    expect(screen.getByText("Your payment was not completed.")).toBeInTheDocument();
    expect(screen.queryByText("Payment received")).not.toBeInTheDocument();
  });

  it("offers recovery on failed status requests", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("network") });
    await act(async () => { mount(); });
    expect(screen.getByRole("alert")).toHaveTextContent("couldn't check your payment status");
    expect(screen.getByRole("button", { name: "Check payment again" })).toBeEnabled();
  });

  it("rejects missing order references instead of displaying success", async () => {
    await act(async () => { mount("success", ""); });
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("valid order reference");
  });

  it("aborts and never schedules more polling after unmount", async () => {
    let resolve: (value: ReturnType<typeof result>) => void;
    invoke.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const view = mount();
    const signal = invoke.mock.calls[0][1].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => { resolve(result("pending")); await vi.advanceTimersByTimeAsync(10000); });
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});
