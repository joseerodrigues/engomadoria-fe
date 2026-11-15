"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function switchPlan(planId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de mudar de pacote." };
  if (typeof planId !== "string" || !/^[a-z0-9-]{1,64}$/.test(planId)) {
    return { error: "O pacote selecionado não é válido." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "A sua sessão terminou. Inicie sessão novamente." };

  const { error } = await supabase.rpc("switch_customer_plan", { p_plan_id: planId });
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return { error: "A base de dados precisa das migrações mais recentes. Execute novamente os ficheiros SQL em supabase/migrations/ no Supabase." };
  }
  if (error) return { error: "Não foi possível mudar de pacote. Atualize a página e tente novamente." };

  revalidatePath("/");
  return {};
}
