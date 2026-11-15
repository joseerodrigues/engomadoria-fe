import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/dashboard-client";
import { SupabaseSetup } from "@/components/supabase-setup";
import { loadDashboardData } from "@/lib/dashboard-data";
import { getLisbonDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const instant = false;

export default function Home() {
  if (!isSupabaseConfigured()) return <SupabaseSetup />;

  return (
    <Suspense fallback={<main className="dashboard-loading">A carregar o seu pacote…</main>}>
      <CustomerDashboard />
    </Suspense>
  );
}

async function CustomerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await loadDashboardData(supabase, user, getLisbonDate());
  return <DashboardClient data={data} />;
}
