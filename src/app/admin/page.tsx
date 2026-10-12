import type { Metadata } from "next";
import { AdminDashboard, type AdminSectionId } from "@/components/admin/admin-dashboard";
import { getAdminSession } from "@/lib/server/admin-auth";
import { buildDashboardAnalytics } from "@/lib/server/analytics-engine";
import { getBackendConfig } from "@/lib/server/env";
import {
  getAllStoreOrders,
  getAllStoreProducts,
  getAllStoreReviews,
  getContactMessages,
  getCustomerAccountsPublic,
  getStoreActivities,
  getStoreCoupons,
  getStoreSettings,
} from "@/lib/server/store-repository";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Enterprise Dashboard | NOOR",
  description:
    "NOOR E-commerce Admin Dashboard — Real-time sales analytics, variant inventory, Cloudinary CDN, and Supabase orders.",
};

const VALID_SECTIONS = new Set<AdminSectionId>([
  "dashboard",
  "products",
  "categories",
  "orders",
  "customers",
  "inventory",
  "coupons",
  "analytics",
  "reviews",
  "banners",
  "shipping",
  "payments",
  "users",
  "settings",
]);

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawSection = resolvedParams?.section as AdminSectionId | undefined;
  const initialSection: AdminSectionId =
    rawSection && VALID_SECTIONS.has(rawSection) ? rawSection : "dashboard";

  const session = await getAdminSession();
  const config = getBackendConfig();

  const [products, orders, coupons, settings, activities, reviews, registeredCustomers, contactMessages] = session
    ? await Promise.all([
        getAllStoreProducts({ bypassCache: true, includeInactive: true }),
        getAllStoreOrders(),
        getStoreCoupons(),
        getStoreSettings(),
        getStoreActivities(),
        getAllStoreReviews({ status: "all" }),
        getCustomerAccountsPublic(),
        getContactMessages(),
      ])
    : [
        [],
        [],
        [],
        await getStoreSettings(),
        [],
        [],
        [],
        [],
      ];

  const initialAnalytics = buildDashboardAnalytics({
    products,
    orders,
    coupons,
    settings,
    activities,
    preset: "last_30_days",
  });

  return (
    <main id="main-content">
      <AdminDashboard
        initialAuthenticated={Boolean(session)}
        initialStatus={{
          supabaseConfigured: config.supabaseConfigured,
          supabaseWriteConfigured: config.supabaseWriteConfigured,
          cloudinaryConfigured: config.cloudinaryConfigured,
          defaultAdminEmail: config.adminEmail,
        }}
        initialAnalytics={initialAnalytics}
        initialProducts={products}
        initialOrders={orders}
        initialReviews={reviews}
        initialRegisteredCustomers={registeredCustomers}
        initialContactMessages={contactMessages}
        initialSection={initialSection}
      />
    </main>
  );
}
