import { NextResponse } from "next/server";
import type { Order } from "@/lib/orders";
import { getStoreOrdersByCustomer, recordCustomerOrder } from "@/lib/server/store-repository";
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/server/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawIds = searchParams.get("ids") ?? "";
    const phone = searchParams.get("phone") ?? undefined;
    const email = searchParams.get("email") ?? undefined;

    const ids = rawIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0 && !phone && !email) {
      return NextResponse.json({ ok: true, orders: [] });
    }

    const orders = await getStoreOrdersByCustomer({ ids, phone, email });
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const order = (await request.json()) as Order;
    if (!order?.id || !order?.customer?.name || !order?.customer?.phone) {
      return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
    }
    const result = await recordCustomerOrder(order);

    // Trigger confirmation email in the background without blocking the checkout response
    if (order.customer?.email && order.customer.email.includes("@")) {
      void sendOrderConfirmationEmail({ order, to: order.customer.email }).catch(() => {});
    }
    void sendAdminNewOrderNotification({ order }).catch(() => {});

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record order.";
    const isStockError =
      message.toLowerCase().includes("stock") ||
      message.toLowerCase().includes("unavailable") ||
      message.includes("স্টক");
    return NextResponse.json({ error: message }, { status: isStockError ? 400 : 500 });
  }
}
