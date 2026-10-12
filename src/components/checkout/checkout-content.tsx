"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  UserCheck,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { catalogProducts } from "@/data/catalog";
import { formatPrice } from "@/data/store";
import type { CatalogProduct } from "@/types/store";
import { ProductPhoto } from "@/components/product/product-photo";
import { announceNotice } from "@/components/ui/coming-soon";
import { clearCartProducts, useCartProducts } from "@/lib/cart-products";
import { loginUserAsync, signupUserAsync, useAuth } from "@/lib/auth";
import {
  placeOrder,
  syncCustomerOrders,
  useOrders,
  type Order,
  type OrderDeliveryZone,
  type OrderPaymentMethod,
} from "@/lib/orders";

const DEFAULT_DELIVERY_FEES: Record<OrderDeliveryZone, { label: string; fee: number; eta: string }> = {
  "inside-dhaka": { label: "Inside Dhaka", fee: 70, eta: "1–2 business days" },
  "outside-dhaka": { label: "Outside Dhaka", fee: 130, eta: "3–5 business days" },
};

const PAYMENT_LABELS: Record<OrderPaymentMethod, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
};

export function CheckoutContent({
  catalog = catalogProducts,
  shippingFees,
}: {
  catalog?: CatalogProduct[];
  shippingFees?: { insideDhaka: number; outsideDhaka: number };
}) {
  const DELIVERY_FEES: Record<OrderDeliveryZone, { label: string; fee: number; eta: string }> = {
    "inside-dhaka": {
      ...DEFAULT_DELIVERY_FEES["inside-dhaka"],
      fee: shippingFees?.insideDhaka ?? DEFAULT_DELIVERY_FEES["inside-dhaka"].fee,
    },
    "outside-dhaka": {
      ...DEFAULT_DELIVERY_FEES["outside-dhaka"],
      fee: shippingFees?.outsideDhaka ?? DEFAULT_DELIVERY_FEES["outside-dhaka"].fee,
    },
  };

  const { items, ready } = useCartProducts();
  const { user } = useAuth();
  const { orders } = useOrders();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [deliveryZone, setDeliveryZone] = useState<OrderDeliveryZone>("inside-dhaka");
  const [city, setCity] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("cod");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Sync confirmedOrder live when admin changes status in backend
  useEffect(() => {
    if (!confirmedOrder) return;
    void syncCustomerOrders();
    const interval = window.setInterval(() => {
      void syncCustomerOrders();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [confirmedOrder]);

  // Post-purchase optional auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login">("signup");
  const [modalPassword, setModalPassword] = useState("");
  const [modalIdentifier, setModalIdentifier] = useState("");
  const [modalError, setModalError] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const effectiveName = name ?? user?.name ?? "";
  const effectivePhone = phone ?? user?.phone ?? "";
  const effectiveEmail = email ?? user?.email ?? "";
  const effectiveCity = city ?? user?.city ?? "Dhaka";
  const effectiveAddress = address ?? user?.address ?? "";

  const [orderError, setOrderError] = useState("");

  const rows = items.flatMap((item) => {
    const product =
      catalog.find(({ id }) => id === item.id) ??
      catalogProducts.find(({ id }) => id === item.id);
    if (!product) return [];
    const availableStock =
      typeof product.stock === "number"
        ? Math.max(0, product.stock)
        : product.details.variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock ?? 0)), 0);
    return [{ product, quantity: item.quantity, colour: item.colour || product.colour, availableStock }];
  });

  const stockIssue = rows.find((r) => r.availableStock <= 0 || r.quantity > r.availableStock);

  const subtotal = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const shippingFee = DELIVERY_FEES[deliveryZone].fee;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCouponError(data.message || "Invalid or inactive coupon code.");
        return;
      }
      setAppliedCoupon({
        code: data.couponCode,
        discountAmount: data.discountAmount,
      });
      setCouponSuccess(data.message || `Coupon ${data.couponCode} applied!`);
      setCouponInput("");
    } catch {
      setCouponError("Failed to apply coupon. Please check connection.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponSuccess("");
    setCouponError("");
  }

  if (!ready) {
    return <p className="checkout-status">Loading your checkout details…</p>;
  }

  async function handleModalAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalError("");

    if (!confirmedOrder) return;

    if (authModalMode === "signup") {
      const result = await signupUserAsync({
        name: confirmedOrder.customer.name,
        phone: confirmedOrder.customer.phone,
        email: confirmedOrder.customer.email,
        address: confirmedOrder.customer.address,
        city: confirmedOrder.customer.city,
        password: modalPassword,
      });
      if (!result.ok) {
        setModalError(result.error);
        return;
      }
      await syncCustomerOrders({ phone: result.user.phone, email: result.user.email });
      setShowAuthModal(false);
      setModalPassword("");
      announceNotice("Account created", `Welcome, ${result.user.name}! Your details are saved for future orders.`);
    } else {
      const result = await loginUserAsync({
        identifier: modalIdentifier.trim() || confirmedOrder.customer.phone,
        password: modalPassword,
      });
      if (!result.ok) {
        setModalError(result.error);
        return;
      }
      await syncCustomerOrders({ phone: result.user.phone, email: result.user.email });
      setShowAuthModal(false);
      setModalPassword("");
      announceNotice("Signed in", `Welcome back, ${result.user.name}!`);
    }
  }

  if (confirmedOrder) {
    const liveOrder = orders.find((o) => o.id === confirmedOrder.id) ?? confirmedOrder;
    const isPending = liveOrder.status === "Pending";
    const isConfirmedStage = liveOrder.status === "Confirmed" || liveOrder.status === "Processing";
    const isShippedStage = liveOrder.status === "Shipped";
    const isDeliveredStage = liveOrder.status === "Delivered";

    const eyebrowText = isPending
      ? "ORDER RECEIVED · PENDING VERIFICATION"
      : isConfirmedStage
        ? "ORDER CONFIRMED · PREPARING FOR SHIPPING"
        : isShippedStage
          ? "YOUR ORDER IS SHIPPED"
          : isDeliveredStage
            ? "ORDER DELIVERED"
            : "ORDER STATUS";

    const statusBadgeText = isPending
      ? "Pending Verification"
      : isConfirmedStage
        ? "Confirmed · Preparing for Shipping"
        : isShippedStage
          ? "Your Order is Shipped"
          : isDeliveredStage
            ? "Delivered ✓"
            : liveOrder.status;

    return (
      <section className={`checkout-confirmation ${isPending ? "is-pending" : ""}`} aria-labelledby="order-confirmed-heading">
        <div className={`confirmation-badge ${isPending ? "is-pending" : ""}`} aria-hidden="true">
          {isPending ? (
            <Clock size={36} />
          ) : isConfirmedStage ? (
            <Package size={36} />
          ) : isShippedStage ? (
            <Truck size={36} />
          ) : (
            <CheckCircle2 size={36} />
          )}
        </div>
        <p className="checkout-eyebrow">{eyebrowText}</p>
        <h2 id="order-confirmed-heading">Thank you for your order, {liveOrder.customer.name}</h2>
        <p className="confirmation-subtitle">
          {isPending ? (
            <>
              Your order <strong>{liveOrder.id}</strong> has been received and is currently{" "}
              <strong>Pending Verification</strong>. Our team will verify your order details before confirming.
            </>
          ) : isConfirmedStage ? (
            <>
              Your order <strong>{liveOrder.id}</strong> is <strong>Confirmed</strong> and{" "}
              <strong>getting ready for shipping (অর্ডারটি শিপিংয়ের জন্য রেডি হচ্ছে)</strong>!
            </>
          ) : isShippedStage ? (
            <>
              🚚 <strong>Your Order is Shipped!</strong> Your package <strong>{liveOrder.id}</strong> has been handed over to our courier and is on the way to your address.
            </>
          ) : isDeliveredStage ? (
            <>
              🎉 Your order <strong>{liveOrder.id}</strong> has been <strong>Delivered</strong>! You can now rate and review your product from your account page.
            </>
          ) : (
            <>
              Your order <strong>{liveOrder.id}</strong> status is currently <strong>{liveOrder.status}</strong>.
            </>
          )}
        </p>

        {user ? (
          <div className="post-purchase-auth-alert is-connected" role="status">
            <UserCheck size={20} aria-hidden="true" />
            <div>
              <strong>Saved to your account ({user.name})</strong>
              <p>You can track this order and manage your delivery addresses anytime from My Account.</p>
            </div>
            <Link href="/account?tab=orders" className="post-purchase-alert-btn">Go to Account</Link>
          </div>
        ) : (
          <div className="post-purchase-auth-alert" role="region" aria-label="Optional account creation">
            <div className="post-purchase-alert-icon" aria-hidden="true">
              <BellRing size={20} />
            </div>
            <div className="post-purchase-alert-copy">
              <strong>Want to track Order {liveOrder.id} & save your address for next time?</strong>
              <p>
                No account was needed to place your order! If you’d like faster 1-click checkout next time, save your
                details now or sign in to an existing account.
              </p>
            </div>
            <div className="post-purchase-alert-actions">
              <button
                type="button"
                className="checkout-primary post-purchase-trigger-btn"
                onClick={() => {
                  setAuthModalMode("signup");
                  setModalError("");
                  setShowAuthModal(true);
                }}
              >
                <UserPlus size={16} aria-hidden="true" />
                Save Account in 1-Step
              </button>
              <Link href="/login" className="checkout-secondary post-purchase-link-btn">
                Log In / Sign Up Page
              </Link>
            </div>
          </div>
        )}

        <div className="confirmation-grid">
          <div className="confirmation-card">
            <h3>Delivery Details</h3>
            <p>
              <strong>Order Status:</strong>{" "}
              <span className={`checkout-status-pill ${isPending ? "pending" : "confirmed"}`}>
                {statusBadgeText}
              </span>
            </p>
            <p><strong>Recipient:</strong> {liveOrder.customer.name}</p>
            <p><strong>Phone:</strong> {liveOrder.customer.phone}</p>
            <p><strong>Address:</strong> {liveOrder.customer.address}, {liveOrder.customer.city}</p>
            <p><strong>Delivery Area:</strong> {DELIVERY_FEES[liveOrder.deliveryZone].label} ({DELIVERY_FEES[liveOrder.deliveryZone].eta})</p>
            <p><strong>Payment Method:</strong> {PAYMENT_LABELS[liveOrder.paymentMethod]}</p>
          </div>

          <div className="confirmation-card">
            <h3>Order Summary ({confirmedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items)</h3>
            <ul className="confirmation-items">
              {confirmedOrder.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.quantity} × {item.name}
                    {item.colour ? ` (${item.colour})` : ""}
                  </span>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <div className="confirmation-totals">
              <div><span>Subtotal</span><span>{formatPrice(confirmedOrder.subtotal)}</span></div>
              {confirmedOrder.discountAmount && confirmedOrder.discountAmount > 0 ? (
                <div>
                  <span>Discount {confirmedOrder.couponCode ? `(${confirmedOrder.couponCode})` : ""}</span>
                  <strong className="text-emerald-600">-{formatPrice(confirmedOrder.discountAmount)}</strong>
                </div>
              ) : null}
              <div><span>Delivery Fee</span><span>{formatPrice(confirmedOrder.shippingFee)}</span></div>
              <div className="confirmation-grand-total"><span>Total</span><strong>{formatPrice(confirmedOrder.total)}</strong></div>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link href="/account?tab=orders" className="checkout-primary">View My Orders</Link>
          <Link href="/shop" className="checkout-secondary">Continue Shopping</Link>
        </div>

        {showAuthModal && !user && (
          <div
            className="post-purchase-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-purchase-modal-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) setShowAuthModal(false);
            }}
          >
            <div className="post-purchase-modal">
              <button
                type="button"
                className="post-purchase-modal-close"
                aria-label="Close account prompt"
                onClick={() => setShowAuthModal(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>

              <span className="post-purchase-modal-badge">
                <Sparkles size={13} aria-hidden="true" />
                Order {confirmedOrder.id} Placed · Optional Account
              </span>

              <h3 id="post-purchase-modal-title">Save your details for next time?</h3>
              <p className="post-purchase-modal-desc">
                Your order is already confirmed! Create a password below to save{" "}
                <strong>{confirmedOrder.customer.name}</strong> ({confirmedOrder.customer.phone}) for 1-click checkout
                and order tracking, or continue as a guest.
              </p>

              <div className="post-purchase-modal-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authModalMode === "signup"}
                  className={authModalMode === "signup" ? "active" : ""}
                  onClick={() => {
                    setAuthModalMode("signup");
                    setModalError("");
                  }}
                >
                  Quick Sign Up (1-Step)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authModalMode === "login"}
                  className={authModalMode === "login" ? "active" : ""}
                  onClick={() => {
                    setAuthModalMode("login");
                    setModalIdentifier(confirmedOrder.customer.phone);
                    setModalError("");
                  }}
                >
                  Existing Account Login
                </button>
              </div>

              <form className="post-purchase-modal-form" onSubmit={handleModalAuthSubmit}>
                {authModalMode === "signup" ? (
                  <div className="post-purchase-prefill-box">
                    <div>
                      <span>Name & Phone</span>
                      <strong>{confirmedOrder.customer.name} · {confirmedOrder.customer.phone}</strong>
                    </div>
                    <div>
                      <span>Saved Address</span>
                      <strong>{confirmedOrder.customer.address}, {confirmedOrder.customer.city}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="checkout-field">
                    <label htmlFor="modal-auth-identifier">Phone Number or Email *</label>
                    <input
                      id="modal-auth-identifier"
                      type="text"
                      required
                      placeholder="01XXXXXXXXX or email"
                      value={modalIdentifier}
                      onChange={(event) => setModalIdentifier(event.target.value)}
                    />
                  </div>
                )}

                <div className="checkout-field">
                  <label htmlFor="modal-auth-password">
                    <Lock size={13} aria-hidden="true" />{" "}
                    {authModalMode === "signup" ? "Choose a Password (min 4 characters) *" : "Your Password *"}
                  </label>
                  <input
                    id="modal-auth-password"
                    type="password"
                    required
                    minLength={4}
                    placeholder="Enter password"
                    value={modalPassword}
                    onChange={(event) => setModalPassword(event.target.value)}
                  />
                </div>

                {modalError && (
                  <p className="post-purchase-modal-error" role="alert">
                    {modalError}
                  </p>
                )}

                <button type="submit" className="checkout-primary post-purchase-modal-submit">
                  {authModalMode === "signup" ? "Save Account & Track Order" : "Sign In & Link Order"}
                </button>

                <div className="post-purchase-modal-footer">
                  <button
                    type="button"
                    className="post-purchase-skip-btn"
                    onClick={() => setShowAuthModal(false)}
                  >
                    No thanks, continue as guest
                  </button>
                  <Link href={authModalMode === "signup" ? "/signup" : "/login"} className="post-purchase-fullpage-link">
                    Open full {authModalMode === "signup" ? "Sign Up" : "Login"} page →
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="checkout-empty">
        <ShoppingBag />
        <h2>Your shopping bag is empty</h2>
        <p>Add your favourite hijabs or accessories to your bag before checking out.</p>
        <Link href="/shop" className="checkout-primary">Explore Collection</Link>
      </section>
    );
  }

  function handleZoneChange(nextZone: OrderDeliveryZone) {
    setDeliveryZone(nextZone);
    if (nextZone === "inside-dhaka" && !effectiveCity.trim()) {
      setCity("Dhaka");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrderError("");
    if (!rows.length) return;

    if (stockIssue) {
      const msg =
        stockIssue.availableStock <= 0
          ? `Sorry, "${stockIssue.product.name}" is currently out of stock. Please remove it from your bag.`
          : `Sorry, only ${stockIssue.availableStock} unit(s) of "${stockIssue.product.name}" are available in stock.`;
      setOrderError(msg);
      return;
    }

    const { order } = placeOrder({
      customer: {
        name: effectiveName.trim(),
        phone: effectivePhone.trim(),
        email: effectiveEmail.trim() || undefined,
        address: effectiveAddress.trim(),
        city: effectiveCity.trim(),
        notes: notes.trim() || undefined,
      },
      deliveryZone,
      paymentMethod,
      paymentPhone: paymentMethod !== "cod" && paymentPhone.trim() ? paymentPhone.trim() : undefined,
      items: rows.map(({ product, quantity, colour }) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity,
        colour,
        photo: { src: product.photo.src, alt: product.photo.alt },
      })),
      subtotal,
      discountAmount,
      couponCode: appliedCoupon?.code ?? null,
      shippingFee,
      total,
      status: "Pending",
    });

    clearCartProducts();
    setConfirmedOrder(order);
    if (!user) {
      setAuthModalMode("signup");
      setModalIdentifier(order.customer.phone);
      setModalError("");
      setShowAuthModal(true);
    }
    announceNotice(
      "Order received",
      user
        ? `Order ${order.id} has been placed and is pending verification.`
        : `Order ${order.id} placed! You can optionally save an account to track your order.`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form className="checkout-layout" onSubmit={handleSubmit}>
      <div className="checkout-main">
        <div className="checkout-guest-banner">
          <div>
            <strong>{user ? `Signed in as ${user.name}` : "Guest Checkout Available — No Login Required"}</strong>
            <span>
              {user
                ? "Your saved delivery details are pre-filled below."
                : "Order directly below without creating an account. You can optionally save your details after ordering."}
            </span>
          </div>
          {!user && (
            <Link href="/login" className="checkout-guest-login-link">
              Have an account? Sign in
            </Link>
          )}
        </div>

        <section className="checkout-section" aria-labelledby="shipping-heading">
          <header className="checkout-section-header">
            <MapPin aria-hidden="true" />
            <div>
              <h2 id="shipping-heading">Contact & Delivery Address</h2>
              <p>Where should we deliver your order?</p>
            </div>
          </header>

          <div className="checkout-fields">
            <div className="checkout-field">
              <label htmlFor="checkout-name">Full Name *</label>
              <input
                id="checkout-name"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Ayesha Rahman"
                value={effectiveName}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="checkout-field-row">
              <div className="checkout-field">
                <label htmlFor="checkout-phone">Phone Number *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  value={effectivePhone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-email">Email Address (Optional)</label>
                <input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={effectiveEmail}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <fieldset className="checkout-choice-group">
              <legend>Delivery Area *</legend>
              <div className="checkout-choice-cards">
                {(Object.keys(DELIVERY_FEES) as OrderDeliveryZone[]).map((zoneKey) => {
                  const info = DELIVERY_FEES[zoneKey];
                  return (
                    <label key={zoneKey} className={`checkout-choice-card ${deliveryZone === zoneKey ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="delivery-zone"
                        value={zoneKey}
                        checked={deliveryZone === zoneKey}
                        onChange={() => handleZoneChange(zoneKey)}
                      />
                      <div>
                        <span className="choice-title">{info.label}</span>
                        <span className="choice-meta">{info.eta}</span>
                      </div>
                      <strong>{formatPrice(info.fee)}</strong>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="checkout-field-row">
              <div className="checkout-field">
                <label htmlFor="checkout-city">City / District *</label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  placeholder="e.g. Dhaka"
                  value={effectiveCity}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="checkout-address">Street Address & Area *</label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="House, Road, Block, Area"
                  value={effectiveAddress}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            </div>

            <div className="checkout-field">
              <label htmlFor="checkout-notes">Delivery Instructions (Optional)</label>
              <textarea
                id="checkout-notes"
                rows={2}
                placeholder="Any landmark or preferred delivery time..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="checkout-section" aria-labelledby="payment-heading">
          <header className="checkout-section-header">
            <CreditCard aria-hidden="true" />
            <div>
              <h2 id="payment-heading">Payment Method</h2>
              <p>Choose how you would like to pay for your order.</p>
            </div>
          </header>

          <fieldset className="checkout-choice-group">
            <legend className="sr-only">Select payment method</legend>
            <div className="checkout-payment-cards">
              <label className={`checkout-choice-card ${paymentMethod === "cod" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <Truck size={18} aria-hidden="true" />
                <div>
                  <span className="choice-title">Cash on Delivery</span>
                  <span className="choice-meta">Pay in cash when your package arrives at your doorstep</span>
                </div>
              </label>

              <label className={`checkout-choice-card ${paymentMethod === "bkash" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="bkash"
                  checked={paymentMethod === "bkash"}
                  onChange={() => setPaymentMethod("bkash")}
                />
                <Wallet size={18} aria-hidden="true" />
                <div>
                  <span className="choice-title">bKash</span>
                  <span className="choice-meta">Fast mobile payment via bKash wallet</span>
                </div>
              </label>

              <label className={`checkout-choice-card ${paymentMethod === "nagad" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="nagad"
                  checked={paymentMethod === "nagad"}
                  onChange={() => setPaymentMethod("nagad")}
                />
                <Wallet size={18} aria-hidden="true" />
                <div>
                  <span className="choice-title">Nagad</span>
                  <span className="choice-meta">Pay securely with your Nagad account</span>
                </div>
              </label>
            </div>
          </fieldset>

          {paymentMethod !== "cod" && (
            <div className="checkout-wallet-box">
              <label htmlFor="checkout-payment-phone">
                {PAYMENT_LABELS[paymentMethod]} Sender Number or Transaction ID *
              </label>
              <input
                id="checkout-payment-phone"
                type="text"
                required
                placeholder={`Enter your ${PAYMENT_LABELS[paymentMethod]} number or TrxID`}
                value={paymentPhone}
                onChange={(event) => setPaymentPhone(event.target.value)}
              />
            </div>
          )}
        </section>
      </div>

      <aside className="checkout-summary" aria-labelledby="summary-heading">
        <h2 id="summary-heading">Order Summary</h2>
        <ul className="checkout-item-list">
          {rows.map(({ product, quantity, colour }) => (
            <li key={product.id} className="checkout-summary-item">
              <Link href={`/products/${product.slug}`} className="checkout-item-thumb" aria-label={product.name}>
                <ProductPhoto photo={product.photo} sizes="56px" />
              </Link>
              <div>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p>
                  Qty: {quantity} × {formatPrice(product.price)}
                  {colour ? <span style={{ textTransform: "capitalize" }}> · {colour}</span> : null}
                </p>
              </div>
              <strong>{formatPrice(product.price * quantity)}</strong>
            </li>
          ))}
        </ul>

        {/* Promo / Coupon Code Section */}
        <div className="checkout-coupon-box">
          {appliedCoupon ? (
            <div className="checkout-coupon-applied">
              <div className="checkout-coupon-applied-info">
                <Tag size={15} aria-hidden="true" />
                <span>
                  Coupon <strong>{appliedCoupon.code}</strong> applied (-{formatPrice(appliedCoupon.discountAmount)})
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="checkout-coupon-remove-btn"
                title="Remove coupon"
                aria-label="Remove coupon"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="checkout-coupon-input-group">
              <div className="checkout-coupon-field">
                <Tag size={14} className="checkout-coupon-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Coupon code (e.g. EID20)"
                  value={couponInput}
                  onChange={(event) => {
                    setCouponInput(event.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleApplyCoupon();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                disabled={couponLoading || !couponInput.trim()}
                onClick={() => void handleApplyCoupon()}
                className="checkout-coupon-btn"
              >
                {couponLoading ? "Applying…" : "Apply"}
              </button>
            </div>
          )}
          {couponError && <p className="checkout-coupon-error" role="alert">{couponError}</p>}
          {couponSuccess && <p className="checkout-coupon-success">{couponSuccess}</p>}
        </div>

        <div className="checkout-cost-rows">
          <div>
            <span>Subtotal ({rows.reduce((sum, r) => sum + r.quantity, 0)} items)</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          {appliedCoupon && appliedCoupon.discountAmount > 0 && (
            <div className="checkout-discount-row">
              <span>Coupon Discount ({appliedCoupon.code})</span>
              <strong className="text-discount">-{formatPrice(appliedCoupon.discountAmount)}</strong>
            </div>
          )}
          <div>
            <span>Delivery ({DELIVERY_FEES[deliveryZone].label})</span>
            <strong>{formatPrice(shippingFee)}</strong>
          </div>
          <div className="checkout-grand-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </div>

        {(stockIssue || orderError) && (
          <p className="checkout-coupon-error" role="alert" style={{ marginBottom: 10 }}>
            {orderError ||
              (stockIssue && stockIssue.availableStock <= 0
                ? `"${stockIssue.product.name}" is out of stock. Please update your shopping bag.`
                : stockIssue
                  ? `Only ${stockIssue.availableStock} unit(s) of "${stockIssue.product.name}" left in stock.`
                  : "")}
          </p>
        )}

        <button
          type="submit"
          className="checkout-primary checkout-submit"
          disabled={Boolean(stockIssue)}
        >
          {stockIssue ? "Adjust Stock in Bag to Order" : `Place Order · ${formatPrice(total)}`}
        </button>

        <Link href="/cart" className="checkout-back-link">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Shopping Bag
        </Link>

        <p className="checkout-trust-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Quality checked before dispatch · Easy 7-day exchange</span>
        </p>
      </aside>
    </form>
  );
}
