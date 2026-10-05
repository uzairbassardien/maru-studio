import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Checkout from "@/pages/Checkout";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn(), clearCart: vi.fn(), useCart: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc, functions: { invoke: mocks.invoke } },
}));
vi.mock("@/context/CartContext", () => ({ useCart: mocks.useCart }));

const cart = () => ({
  items: [{ product: { id: "dress", name: "Maru Dress", price: 650, images: [] }, size: "M", quantity: 1 }],
  totalPrice: 650,
  clearCart: mocks.clearCart,
});
const page = () => <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Checkout /></MemoryRouter>;
const submitCheckout = () => fireEvent.submit(screen.getByRole("button", { name: "Pay securely with PayFast" }).closest("form")!);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.useCart.mockImplementation(cart);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("checkout payment handoff notice", () => {
  it("stays visible while preparing payment and after the cart clears for the gateway redirect", async () => {
    let finishOrder: (value: unknown) => void;
    let finishPayment: (value: unknown) => void;
    mocks.rpc.mockImplementation(() => new Promise((resolve) => { finishOrder = resolve; }));
    mocks.invoke.mockImplementation(() => new Promise((resolve) => { finishPayment = resolve; }));
    const submit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
    mocks.clearCart.mockImplementation(() => mocks.useCart.mockReturnValue({ ...cart(), items: [], totalPrice: 0 }));
    const view = render(page());
    submitCheckout();
    expect(screen.getByRole("status")).toHaveTextContent("Redirecting you to PayFast...");
    await act(async () => { finishOrder({ data: { id: "order-1", order_number: "MBM-TEST", total: 650 }, error: null }); });
    expect(screen.getByRole("status")).toHaveTextContent("Please keep this page open");
    expect(mocks.clearCart).not.toHaveBeenCalled();
    await act(async () => { finishPayment({ data: { action: "https://sandbox.payfast.co.za/eng/process", fields: { amount: "650.00" } }, error: null }); });
    view.rerender(page());
    expect(mocks.clearCart).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
    const paymentForm = document.querySelector<HTMLFormElement>('form[action="https://sandbox.payfast.co.za/eng/process"]');
    expect(paymentForm?.method).toBe("post");
    expect(paymentForm?.action).toBe("https://sandbox.payfast.co.za/eng/process");
    expect(paymentForm?.querySelector("input")?.value).toBe("650.00");
    expect(screen.getByRole("status")).toHaveTextContent("Redirecting you to PayFast...");
    expect(screen.queryByText("Your cart is empty.")).not.toBeInTheDocument();
    paymentForm?.remove();
  });

  it.each(["order", "payment"])("returns to checkout without clearing the cart when %s preparation fails", async (stage) => {
    mocks.rpc.mockResolvedValue(stage === "order"
      ? { data: null, error: { message: "Order unavailable" } }
      : { data: { id: "order-1" }, error: null });
    mocks.invoke.mockResolvedValue({ data: null, error: new Error("unavailable") });
    render(page());
    await act(async () => { submitCheckout(); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(stage === "order" ? "Order unavailable" : "couldn't connect to PayFast");
    expect(screen.getByRole("button", { name: "Pay securely with PayFast" })).toBeEnabled();
    expect(mocks.clearCart).not.toHaveBeenCalled();
  });
});
