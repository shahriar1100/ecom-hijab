"use client";

import { useSyncExternalStore } from "react";

export const ORDERS_STORAGE_KEY = "noor-orders";
export type OrderDeliveryZone = "inside-dhaka" | "outside-dhaka";
export type OrderPaymentMethod = "cod" | "bkash" | "nagad";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type OrderItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  colour?: string;
  photo: { src: string; alt: string };
};

export type Order = {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    notes?: string;
  };
  deliveryZone: OrderDeliveryZone;
  paymentMethod: OrderPaymentMethod;
  paymentPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string | null;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus?: "Paid" | "Pending" | "Failed" | "Refunded" | "Partially Refunded";
  deliveryStatus?:
    | "Pending Dispatch"
    | "In Transit"
    | "Out for Delivery"
    | "Delivered"
    | "Returned"
    | "Cancelled";
};

type OrdersState = { orders: readonly Order[]; ready: boolean; persistent: boolean };
const serverState: OrdersState = { orders: [], ready: false, persistent: true };
let state = serverState;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

function parse(raw: string | null): Order[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Order =>
      Boolean(item && typeof item === "object" && "id" in item && "items" in item),
    );
  } catch {
    return [];
  }
}

function snapshot(): OrdersState {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!state.ready || raw !== lastRaw) {
      lastRaw = raw;
      state = { orders: parse(raw), ready: true, persistent: true };
    }
  } catch {
    state = { ...state, ready: true, persistent: false };
  }
  return state;
}

function write(orders: readonly Order[]) {
  const next = { orders, ready: true, persistent: true };
  try {
    const raw = JSON.stringify(orders);
    localStorage.setItem(ORDERS_STORAGE_KEY, raw);
    lastRaw = raw;
  } catch {
    next.persistent = false;
  }
  state = next;
  listeners.forEach((listener) => listener());
  return next;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ORDERS_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function placeOrder(
  input: Omit<Order, "id" | "createdAt" | "status"> & { status?: OrderStatus },
) {
  const current = snapshot();
  const code = String(Date.now()).slice(-6);

  // Cash on Delivery and new customer orders start in "Pending" status
  // Only after backend admin confirmation does it show "Confirmed"
  const initialStatus: OrderStatus = input.status ?? "Pending";
  const initialPaymentStatus =
    input.paymentMethod === "cod" ? ("Pending" as const) : ("Paid" as const);

  const order: Order = {
    ...input,
    id: `NR-${code}`,
    createdAt: new Date().toISOString(),
    status: initialStatus,
    paymentStatus: input.paymentStatus ?? initialPaymentStatus,
    deliveryStatus: input.deliveryStatus ?? "Pending Dispatch",
  };

  const result = write([order, ...current.orders]);
  if (typeof window !== "undefined") {
    void fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => {
      // Order remains persisted in localStorage if offline
    });
  }
  return { order, persistent: result.persistent };
}

export type OrderStatusTransition = {
  order: Order;
  previousStatus: OrderStatus;
};

export async function syncCustomerOrders(customerFilter?: {
  phone?: string;
  email?: string;
}): Promise<OrderStatusTransition[]> {
  if (typeof window === "undefined") return [];
  const current = snapshot();

  let sessionPhone = customerFilter?.phone ?? "";
  let sessionEmail = customerFilter?.email ?? "";

  if (!sessionPhone && !sessionEmail) {
    try {
      const rawSession = window.localStorage.getItem("noor:auth-user:v1");
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession) as { phone?: string; email?: string };
        sessionPhone = parsedSession.phone?.trim() ?? "";
        sessionEmail = parsedSession.email?.trim() ?? "";
      }
    } catch {
      // Ignore storage read error
    }
  }

  const ids = current.orders.map((o) => o.id).join(",");
  if (!ids && !sessionPhone && !sessionEmail) return [];

  try {
    const params = new URLSearchParams();
    if (ids) params.set("ids", ids);
    if (sessionPhone) params.set("phone", sessionPhone);
    if (sessionEmail) params.set("email", sessionEmail);

    const response = await fetch(`/api/orders?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { ok: boolean; orders?: Order[] };
    if (!data.ok || !Array.isArray(data.orders)) return [];

    const serverMap = new Map<string, Order>();
    for (const serverOrder of data.orders) {
      serverMap.set(serverOrder.id, serverOrder);
    }

    let hasChanges = false;
    const transitions: OrderStatusTransition[] = [];
    const localIdSet = new Set(current.orders.map((o) => o.id));

    const updated = current.orders.map((localOrder) => {
      const serverMatch = serverMap.get(localOrder.id);
      if (
        serverMatch &&
        (serverMatch.status !== localOrder.status ||
          serverMatch.paymentStatus !== localOrder.paymentStatus ||
          serverMatch.deliveryStatus !== localOrder.deliveryStatus)
      ) {
        hasChanges = true;
        const nextOrder: Order = {
          ...localOrder,
          status: serverMatch.status,
          paymentStatus: serverMatch.paymentStatus ?? localOrder.paymentStatus,
          deliveryStatus: serverMatch.deliveryStatus ?? localOrder.deliveryStatus,
        };
        if (serverMatch.status !== localOrder.status) {
          transitions.push({
            order: nextOrder,
            previousStatus: localOrder.status,
          });
        }
        return nextOrder;
      }
      return localOrder;
    });

    // Merge any orders found on the server for this customer's phone/email that were placed on another device
    for (const serverOrder of data.orders) {
      if (!localIdSet.has(serverOrder.id)) {
        updated.push(serverOrder);
        localIdSet.add(serverOrder.id);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updated.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      write(updated);
    }
    return transitions;
  } catch {
    // Offline or network error; keep existing orders
    return [];
  }
}

export function useOrders() {
  return useSyncExternalStore(subscribe, snapshot, () => serverState);
}
