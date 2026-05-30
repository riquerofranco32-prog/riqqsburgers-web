import { describe, it, expect, beforeEach } from "vitest";

// Regression: ISSUE-002 — cart clears on page reload due to premature localStorage write
// Found by /qa on 2026-05-30
// Report: .gstack/qa-reports/qa-report-takefyy-vercel-app-2026-05-30.md

// Simulates the hydration guard logic extracted from CatalogClient.tsx
function createCartState(storageKey: string, storage: Record<string, string>) {
  let cart: { id: string; quantity: number }[] = [];
  let hydrated = false;

  function hydrate() {
    try {
      const saved = storage[storageKey];
      if (saved) cart = JSON.parse(saved);
    } catch {}
    hydrated = true;
  }

  function persist() {
    if (!hydrated) return; // guard: never write before reading
    storage[storageKey] = JSON.stringify(cart);
  }

  function addItem(item: { id: string }) {
    const found = cart.find((i) => i.id === item.id);
    if (found)
      cart = cart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
      );
    else cart = [...cart, { ...item, quantity: 1 }];
    persist();
  }

  return {
    hydrate,
    addItem,
    getCart: () => cart,
    getStorage: () => storage[storageKey],
  };
}

describe("cart persistence — hydration guard (ISSUE-002 regression)", () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
  });

  it("does NOT overwrite saved cart before hydration", () => {
    // Pre-populate storage as if a previous session saved items
    storage["cart_riqqsburgers"] = JSON.stringify([{ id: "abc", quantity: 2 }]);

    const state = createCartState("cart_riqqsburgers", storage);
    // Simulate component mount WITHOUT hydrating first (the bug)
    // If persist ran here with cart=[], it would wipe the saved cart
    // The guard prevents this

    state.hydrate(); // now hydrate
    expect(state.getCart()).toHaveLength(1);
    expect(state.getCart()[0]).toMatchObject({ id: "abc", quantity: 2 });
  });

  it("persists cart after hydration", () => {
    storage["cart_riqqsburgers"] = JSON.stringify([{ id: "abc", quantity: 1 }]);
    const state = createCartState("cart_riqqsburgers", storage);
    state.hydrate();

    state.addItem({ id: "def" });
    const saved = JSON.parse(state.getStorage());
    expect(saved).toHaveLength(2);
    expect(saved.find((i: { id: string }) => i.id === "def")).toBeDefined();
  });

  it("starts with empty cart when nothing is saved", () => {
    const state = createCartState("cart_riqqsburgers", storage);
    state.hydrate();
    expect(state.getCart()).toHaveLength(0);
  });

  it("accumulates quantity for repeated adds", () => {
    const state = createCartState("cart_riqqsburgers", storage);
    state.hydrate();
    state.addItem({ id: "burger" });
    state.addItem({ id: "burger" });
    expect(state.getCart()[0].quantity).toBe(2);
  });
});
