import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/data/products";
import Shop from "@/pages/Shop";
import Index from "@/pages/Index";

const catalog = vi.hoisted(() => ({ products: [] as Product[], categories: [
  { id: "dress-id", slug: "dresses", name: "Dresses", is_active: true },
  { id: "top-id", slug: "tops", name: "Tops", is_active: true },
] }));
vi.mock("@/hooks/useProducts", () => ({ useProducts: () => ({ data: catalog.products, isLoading: false, isError: false }) }));
vi.mock("@/hooks/useCategories", () => ({ useCategories: () => ({ data: catalog.categories, isLoading: false, isError: false }) }));
vi.mock("@/components/storefront/Hero", () => ({ default: () => <section>Hero</section> }));
afterEach(cleanup);

function product(id: string, changes: Partial<Product> = {}): Product {
  return { id, name: id, price: 500, description: "", fabric: "", care: "", images: ["/placeholder.svg"], sizes: ["S"], category: "collection", categoryId: "dress-id", isFeatured: false, isBestseller: false, ...changes };
}
function mount(page: React.ReactNode, url = "/") {
  return render(<MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{page}</MemoryRouter>);
}

describe("database-backed storefront selections", () => {
  it("uses the category slug in the URL and the database category ID to match products", () => {
    catalog.products = [product("Dress"), product("Top", { categoryId: "top-id" })];
    mount(<Shop />, "/shop?category=tops");
    expect(screen.getByRole("link", { name: /Top R500/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Dress R500/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dresses" }));
    expect(screen.getByRole("link", { name: /Dress R500/ })).toBeInTheDocument();
  });

  it("combines new-arrivals and category filters without showing the full catalogue", () => {
    catalog.products = [product("New top", { categoryId: "top-id", category: "new" }), product("Older top", { categoryId: "top-id" }), product("New dress", { category: "new" })];
    mount(<Shop />, "/shop?category=tops&collection=new");
    expect(screen.getByRole("link", { name: /New top R500/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Older top R500/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /New dress R500/ })).not.toBeInTheDocument();
  });

  it("does not silently fall back to all products for an unknown category", () => {
    catalog.products = [product("Dress")];
    mount(<Shop />, "/shop?category=missing");
    expect(screen.getByText(/This category is unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Dress R500/ })).not.toBeInTheDocument();
  });

  it("combines category, price, size and Most Loved filters and sorts matching pieces", () => {
    catalog.products = [
      product("Higher", { price: 700, sizes: ["M"], isFeatured: true }),
      product("Lower", { price: 550, sizes: ["M"], isBestseller: true }),
      product("Wrong size", { price: 600, sizes: ["L"], isFeatured: true }),
      product("Wrong category", { categoryId: "top-id", price: 600, sizes: ["M"], isFeatured: true }),
      product("Too expensive", { price: 900, sizes: ["M"], isFeatured: true }),
      product("Not loved", { price: 600, sizes: ["M"] }),
    ];
    mount(<Shop />, "/shop?category=dresses&collection=loved&size=M&min=500&max=750&sort=price-asc");
    const cards = () => Array.from(document.querySelectorAll(".product-card h3")).map((node) => node.textContent);
    expect(cards()).toEqual(["Lower", "Higher"]);
    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), { target: { value: "price-desc" } });
    expect(cards()).toEqual(["Higher", "Lower"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Up to R750 filter" }));
    expect(cards()).toEqual(["Too expensive", "Higher", "Lower"]);
  });

  it("applies entered prices and lets shoppers recover from an empty selection", () => {
    catalog.products = [product("Dress", { price: 500 })];
    mount(<Shop />, "/shop");
    fireEvent.change(screen.getByLabelText("Maximum price"), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply price" }));
    expect(screen.getByText(/No pieces match/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("link", { name: /Dress R500/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum price")).toHaveValue(null);
  });

  it("caps new arrivals at six and Most Loved at four using only admin selections", () => {
    catalog.products = Array.from({ length: 9 }, (_, index) => product(`Piece ${index}`, { category: "new", isFeatured: index > 2 }));
    mount(<Index />);
    const arrivals = screen.getByRole("heading", { name: "New Arrivals" }).closest("section")!;
    const loved = screen.getByRole("heading", { name: "Most Loved" }).closest("section")!;
    expect(within(arrivals).getAllByRole("link", { name: /Piece/ })).toHaveLength(6);
    expect(within(loved).getAllByRole("link", { name: /Piece/ })).toHaveLength(4);
    expect(within(loved).queryByRole("link", { name: /Piece 0/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dresses.*Explore/ })).toHaveAttribute("href", "/shop?category=dresses");
  });
});
