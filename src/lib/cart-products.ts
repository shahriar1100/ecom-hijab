"use client";

import { useSyncExternalStore } from "react";
import { catalogProducts } from "@/data/catalog";

export const CART_STORAGE_KEY = "noor-cart-products";
export type CartItem = { id: string; quantity: number };
type CartState = { items: readonly CartItem[]; ready: boolean; persistent: boolean };
const serverState: CartState = { items: [], ready: false, persistent: true };
const validIds = new Set(catalogProducts.map(({ id }) => id));
let state = serverState;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();
function parse(raw: string | null): CartItem[] { try { const value: unknown = JSON.parse(raw ?? "[]"); if (!Array.isArray(value)) return []; const quantities = new Map<string, number>(); for (const item of value) { if (!item || typeof item !== "object") continue; const { id, quantity } = item as { id?: unknown; quantity?: unknown }; if (typeof id === "string" && validIds.has(id) && typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0) quantities.set(id, Math.min(quantity, 99)); } return [...quantities].map(([id, quantity]) => ({ id, quantity })); } catch { return []; } }
function snapshot(): CartState { try { const raw = localStorage.getItem(CART_STORAGE_KEY); if (!state.ready || raw !== lastRaw) { lastRaw = raw; state = { items: parse(raw), ready: true, persistent: true }; } } catch { state = { ...state, ready: true, persistent: false }; } return state; }
function write(items: readonly CartItem[]) { const next = { items, ready: true, persistent: true }; try { const raw = JSON.stringify(items); localStorage.setItem(CART_STORAGE_KEY, raw); lastRaw = raw; } catch { next.persistent = false; } state = next; listeners.forEach((listener) => listener()); return next; }
function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
export function addProductToCart(id: string) { const current = snapshot(); if (!validIds.has(id)) return current; const match = current.items.find((item) => item.id === id); return write(match ? current.items.map((item) => item.id === id ? { ...item, quantity: Math.min(item.quantity + 1, 99) } : item) : [{ id, quantity: 1 }, ...current.items]); }
export function setCartQuantity(id: string, quantity: number) { const current = snapshot(); return write(quantity <= 0 ? current.items.filter((item) => item.id !== id) : current.items.map((item) => item.id === id ? { ...item, quantity: Math.min(Math.floor(quantity), 99) } : item)); }
export function useCartProducts() { return useSyncExternalStore(subscribe, snapshot, () => serverState); }
