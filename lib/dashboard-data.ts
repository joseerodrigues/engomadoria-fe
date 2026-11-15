import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Garment = {
  id: string;
  name: string;
  singular: string;
  slots: number;
  icon: string;
  active: boolean;
};

export type PackagePlan = {
  id: string;
  name: string;
  monthlyCredits: number;
  durationMonths: number;
  active: boolean;
};

export type PackagePeriod = {
  id: string;
  planName: string;
  monthlyCredits: number;
  durationMonths: number;
  startedOn: string;
  expiresOn: string | null;
  status: "active" | "ended";
};

export type DeliveryItem = {
  garmentId: string;
  name: string;
  quantity: number;
  creditsPerPiece: number;
};

export type Delivery = {
  id: string;
  date: string;
  items: DeliveryItem[];
};

export type DashboardData = {
  customerName: string;
  email: string;
  today: string;
  packageName: string | null;
  currentPlanId: string | null;
  plans: PackagePlan[];
  packageStartedOn: string | null;
  packageExpiresOn: string | null;
  packageHistory: PackagePeriod[];
  monthlyCredits: number;
  periodStart: string;
  periodEnd: string;
  garments: Garment[];
  deliveries: Delivery[];
};

export async function loadDashboardData(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string; user_metadata: Record<string, unknown> },
  today: string,
): Promise<DashboardData> {
  const { data: customerPackages, error: packageError } = await supabase
    .from("customer_packages")
    .select("id, plan_id, valid_from, valid_until")
    .eq("customer_id", user.id)
    .eq("status", "active")
    .lte("valid_from", today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("valid_from", { ascending: false })
    .limit(1);

  if (packageError) throw new Error("Não foi possível carregar o seu pacote.");

  const { data: packageHistoryRows, error: packageHistoryError } = await supabase
    .from("customer_packages")
    .select("id, plan_name_snapshot, monthly_credits_snapshot, duration_months_snapshot, valid_from, valid_until, status")
    .eq("customer_id", user.id)
    .order("valid_from", { ascending: false });

  if (packageHistoryError) throw new Error("Não foi possível carregar o histórico de pacotes.");

  const customerPackage = customerPackages?.[0];
  const [{ data: garmentRows, error: garmentsError }, { data: planRows, error: plansError }] = await Promise.all([
    supabase.from("garment_types").select("id, name_pt, singular_pt, credits_per_piece, icon, is_active").order("name_pt"),
    supabase.from("package_plans").select("id, name_pt, monthly_credits, duration_months, is_active").order("monthly_credits"),
  ]);

  if (garmentsError || plansError) throw new Error("Não foi possível carregar os dados do pacote.");
  const plans: PackagePlan[] = (planRows ?? []).map((plan) => ({
    id: plan.id,
    name: plan.name_pt,
    monthlyCredits: plan.monthly_credits,
    durationMonths: plan.duration_months,
    active: plan.is_active,
  }));
  const currentPlan = plans.find((plan) => plan.id === customerPackage?.plan_id);

  const garments: Garment[] = (garmentRows ?? []).map((garment) => ({
    id: garment.id,
    name: garment.name_pt,
    singular: garment.singular_pt,
    slots: garment.credits_per_piece,
    icon: garment.icon,
    active: garment.is_active,
  }));

  const [year, month] = today.split("-").map(Number);
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: deliveryRows, error: deliveriesError } = await supabase
    .from("deliveries")
    .select("id, delivered_on")
    .eq("customer_id", user.id)
    .order("delivered_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);

  if (deliveriesError) throw new Error("Não foi possível carregar o histórico de entregas.");

  const deliveryIds = (deliveryRows ?? []).map((delivery) => delivery.id);
  const { data: itemRows, error: itemsError } = deliveryIds.length
    ? await supabase
        .from("delivery_items")
        .select("delivery_id, garment_type_id, garment_name_snapshot, quantity, credits_per_piece_snapshot")
        .in("delivery_id", deliveryIds)
    : { data: [], error: null };

  if (itemsError) throw new Error("Não foi possível carregar as peças das entregas.");

  const deliveries: Delivery[] = (deliveryRows ?? []).map((delivery) => ({
    id: delivery.id,
    date: delivery.delivered_on,
    items: (itemRows ?? [])
      .filter((item) => item.delivery_id === delivery.id)
      .map((item) => ({
        garmentId: item.garment_type_id,
        name: item.garment_name_snapshot,
        quantity: item.quantity,
        creditsPerPiece: item.credits_per_piece_snapshot,
      })),
  }));

  const name = user.user_metadata.full_name;

  return {
    customerName: typeof name === "string" && name.trim() ? name.trim() : user.email?.split("@")[0] ?? "Cliente",
    email: user.email ?? "",
    today,
    packageName: currentPlan?.name ?? null,
    currentPlanId: currentPlan?.id ?? null,
    plans,
    packageStartedOn: customerPackage?.valid_from ?? null,
    packageExpiresOn: customerPackage?.valid_until ?? null,
    packageHistory: (packageHistoryRows ?? []).map((period) => ({
      id: period.id,
      planName: period.plan_name_snapshot,
      monthlyCredits: period.monthly_credits_snapshot,
      durationMonths: period.duration_months_snapshot,
      startedOn: period.valid_from,
      expiresOn: period.valid_until,
      status: period.status,
    })).sort((a, b) => {
      const aIsActive = a.status === "active" && a.startedOn <= today && (!a.expiresOn || a.expiresOn >= today);
      const bIsActive = b.status === "active" && b.startedOn <= today && (!b.expiresOn || b.expiresOn >= today);
      if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;
      return b.startedOn.localeCompare(a.startedOn);
    }),
    monthlyCredits: currentPlan?.monthlyCredits ?? 0,
    periodStart,
    periodEnd,
    garments,
    deliveries,
  };
}
