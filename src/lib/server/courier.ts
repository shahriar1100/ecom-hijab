import type { CourierConfig, FraudCheckResult } from "@/types/store";
import { getAllStoreOrders, updateStoreOrder, getStoreSettings } from "./store-repository";

const STEADFAST_BASE_URL = "https://portal.steadfast.com.bd/api/v1";

/**
 * Normalizes Bangladeshi phone numbers into standard format: 01XXXXXXXXX
 */
export function normalizeBdPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("8801")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("88")) {
    digits = digits.slice(2);
  }
  return digits;
}

/**
 * Performs intelligent courier fraud checking by combining:
 * 1. Store's internal customer order history (delivered vs cancelled vs returned).
 * 2. Steadfast / BD Courier live delivery success rate (if API credentials configured).
 */
export async function checkCourierFraud(
  rawPhone: string,
  providedConfig?: CourierConfig,
): Promise<FraudCheckResult> {
  const phone = normalizeBdPhoneNumber(rawPhone);
  if (!phone || phone.length < 11) {
    return {
      phone: rawPhone,
      riskLevel: "unknown",
      notes: "Invalid or incomplete phone number.",
      source: "internal",
    };
  }

  // 1. Calculate Internal Order History
  const allOrders = await getAllStoreOrders();
  const matchingOrders = allOrders.filter(
    (o) => normalizeBdPhoneNumber(o.customer?.phone || "") === phone,
  );

  const internalTotal = matchingOrders.length;
  const internalDelivered = matchingOrders.filter((o) => o.status === "Delivered").length;
  const internalReturned = matchingOrders.filter(
    (o) => o.status === "Returned" || o.deliveryStatus === "Returned",
  ).length;
  const internalCancelled = matchingOrders.filter((o) => o.status === "Cancelled").length;

  const config = providedConfig ?? (await getStoreSettings()).courier;

  // 2. Query Steadfast Courier Fraud API if credentials exist
  let steadfastData: {
    total?: number;
    delivered?: number;
    cancelled?: number;
    returned?: number;
  } | null = null;

  if (config?.steadfastApiKey && config?.steadfastSecretKey) {
    try {
      // Steadfast Fraud Check Endpoint
      const res = await fetch(`${STEADFAST_BASE_URL}/fraud-check/${phone}`, {
        method: "GET",
        headers: {
          "Api-Key": config.steadfastApiKey,
          "Secret-Key": config.steadfastSecretKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          status?: number;
          data?: {
            total_parcels?: number;
            success_parcels?: number;
            cancelled_parcels?: number;
            returned_parcels?: number;
          };
        };
        if (json?.data) {
          steadfastData = {
            total: json.data.total_parcels ?? 0,
            delivered: json.data.success_parcels ?? 0,
            cancelled: json.data.cancelled_parcels ?? 0,
            returned: json.data.returned_parcels ?? 0,
          };
        }
      }
    } catch {
      // Steadfast API offline or rate-limited; fallback to internal history
    }
  }

  // 3. Synthesize Fraud Score
  if (steadfastData && (steadfastData.total ?? 0) > 0) {
    const total = (steadfastData.total ?? 0) + internalTotal;
    const delivered = (steadfastData.delivered ?? 0) + internalDelivered;
    const returned = (steadfastData.returned ?? 0) + internalReturned;
    const cancelled = (steadfastData.cancelled ?? 0) + internalCancelled;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 100;

    let riskLevel: FraudCheckResult["riskLevel"] = "safe";
    let notes = `Nationwide Delivery Rate: ${rate}% (${delivered}/${total} completed). Safe buyer.`;

    if (returned >= 3 || rate < 55) {
      riskLevel = "high";
      notes = `High return risk! ${returned} parcels returned previously (${rate}% success rate). Take delivery charge in advance!`;
    } else if (returned >= 1 || rate < 75) {
      riskLevel = "moderate";
      notes = `Moderate risk: ${returned} return(s) on record (${rate}% success rate). Confirm order by call before shipping.`;
    }

    return {
      phone,
      riskLevel,
      successRate: rate,
      totalParcels: total,
      deliveredParcels: delivered,
      cancelledParcels: cancelled,
      returnedParcels: returned,
      totalOrders: total,
      totalCancelled: cancelled + returned,
      storeOrdersCount: internalTotal,
      storeDeliveredCount: internalDelivered,
      storeCancelledCount: internalCancelled + internalReturned,
      courierTotalOrders: steadfastData.total ?? 0,
      courierSuccessOrders: steadfastData.delivered ?? 0,
      courierCancelledOrders: (steadfastData.cancelled ?? 0) + (steadfastData.returned ?? 0),
      notes,
      source: "combined",
    };
  }

  // Internal history only
  if (internalTotal > 0) {
    const rate = Math.round((internalDelivered / internalTotal) * 100);
    let riskLevel: FraudCheckResult["riskLevel"] = "safe";
    let notes = `Returning customer: ${internalDelivered}/${internalTotal} orders completed on this store.`;

    if (internalReturned >= 2) {
      riskLevel = "high";
      notes = `Warning: ${internalReturned} orders returned on this store. Take advance delivery fee.`;
    } else if (internalReturned === 1 || (internalCancelled >= 2 && internalDelivered === 0)) {
      riskLevel = "moderate";
      notes = `Caution: 1 order returned or cancelled previously. Call to verify.`;
    }

    return {
      phone,
      riskLevel,
      successRate: rate,
      totalParcels: internalTotal,
      deliveredParcels: internalDelivered,
      cancelledParcels: internalCancelled,
      returnedParcels: internalReturned,
      totalOrders: internalTotal,
      totalCancelled: internalCancelled + internalReturned,
      storeOrdersCount: internalTotal,
      storeDeliveredCount: internalDelivered,
      storeCancelledCount: internalCancelled + internalReturned,
      courierTotalOrders: 0,
      courierSuccessOrders: 0,
      courierCancelledOrders: 0,
      notes,
      source: "internal",
    };
  }

  // Clean / First-time buyer
  return {
    phone,
    riskLevel: "safe",
    successRate: 100,
    totalParcels: 0,
    deliveredParcels: 0,
    cancelledParcels: 0,
    returnedParcels: 0,
    totalOrders: 0,
    totalCancelled: 0,
    storeOrdersCount: 0,
    storeDeliveredCount: 0,
    storeCancelledCount: 0,
    courierTotalOrders: 0,
    courierSuccessOrders: 0,
    courierCancelledOrders: 0,
    notes: "New customer with a clean record. No previous cancellations or returns detected.",
    source: "internal",
  };
}

/**
 * Dispatches an order to the active courier provider (Steadfast / Pathao)
 */
export async function dispatchOrderToCourier(
  orderId: string,
  providedConfig?: CourierConfig,
): Promise<{
  ok: boolean;
  trackingCode?: string;
  consignmentId?: string;
  message: string;
}> {
  const allOrders = await getAllStoreOrders();
  const order = allOrders.find((o) => o.id === orderId);

  if (!order) {
    return { ok: false, message: `Order #${orderId} was not found.` };
  }

  const config = providedConfig ?? (await getStoreSettings()).courier;
  const provider = config?.provider || "steadfast";

  // Check if Steadfast credentials are provided
  if (provider === "steadfast") {
    if (!config?.steadfastApiKey?.trim() || !config?.steadfastSecretKey?.trim()) {
      return {
        ok: false,
        message:
          "Steadfast Courier API credentials are not configured yet. Go to Admin Settings -> Courier Integration and enter your Steadfast API Key and Secret Key.",
      };
    }

    const codAmount = order.paymentMethod === "cod" ? order.total : 0;
    const recipientPhone = normalizeBdPhoneNumber(order.customer?.phone || "");
    const recipientAddress = [order.customer?.address, order.customer?.city]
      .filter(Boolean)
      .join(", ");

    try {
      const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
        method: "POST",
        headers: {
          "Api-Key": config.steadfastApiKey.trim(),
          "Secret-Key": config.steadfastSecretKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice: order.id,
          recipient_name: order.customer?.name || "Customer",
          recipient_phone: recipientPhone,
          recipient_address: recipientAddress || "Dhaka, Bangladesh",
          cod_amount: codAmount,
          note: order.customer?.notes?.trim() || "NOOR Hijab Modest Wear Delivery",
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data = (await response.json()) as {
        status?: number;
        message?: string;
        consignment?: {
          consignment_id?: string | number;
          tracking_code?: string;
          status?: string;
        };
        errors?: Record<string, string[]>;
      };

      if (response.ok && data?.consignment) {
        const trackingCode = String(data.consignment.tracking_code || "");
        const consignmentId = String(data.consignment.consignment_id || "");

        // Update local store order
        await updateStoreOrder({
          id: order.id,
          status: "Shipped",
          deliveryStatus: "In Transit",
          courierProvider: "steadfast",
          courierTrackingCode: trackingCode,
          courierConsignmentId: consignmentId,
        });

        return {
          ok: true,
          trackingCode,
          consignmentId,
          message: `Parcel booked with Steadfast! Tracking Code: ${trackingCode}`,
        };
      }

      const errorMsg =
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(", ") : "Steadfast API error.");
      return { ok: false, message: `Steadfast Error: ${errorMsg}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error contacting Steadfast.";
      return { ok: false, message };
    }
  }

  // Pathao Courier fallback/provider
  if (provider === "pathao") {
    if (!config?.pathaoClientId || !config?.pathaoClientSecret) {
      return {
        ok: false,
        message:
          "Pathao Courier API credentials are not configured yet. Go to Admin Settings -> Courier Integration and enter your Pathao credentials.",
      };
    }
    // Pathao dispatch implementation
    return {
      ok: false,
      message: "Pathao live parcel creation requires configured Store ID in settings.",
    };
  }

  return { ok: false, message: "No supported courier selected." };
}
