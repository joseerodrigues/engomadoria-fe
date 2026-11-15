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
  packageName: string | null;
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
    .select("id, plan_id, valid_from")
    .eq("customer_id", user.id)
    .eq("status", "active")
    .lte("valid_from", today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("valid_from", { ascending: false })
    .limit(1);

  if (packageError) throw new Error("Não foi possível carregar o seu pacote.");

  const customerPackage = customerPackages?.[0];
  const [{ data: garmentRows, error: garmentsError }, { data: plan, error: planError }] = await Promise.all([
    supabase.from("garment_types").select("id, name_pt, singular_pt, credits_per_piece, icon, is_active").order("name_pt"),
    customerPackage
      ? supabase.from("package_plans").select("name_pt, monthly_credits").eq("id", customerPackage.plan_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (garmentsError || planError) throw new Error("Não foi possível carregar os dados do pacote.");

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
    packageName: plan?.name_pt ?? null,
    monthlyCredits: plan?.monthly_credits ?? 0,
    periodStart,
    periodEnd,
    garments,
    deliveries,
  };
}
