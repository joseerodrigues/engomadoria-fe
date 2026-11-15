"use server";

import { revalidatePath } from "next/cache";
import { getLisbonDate } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type DeliveryDraftItem = { garmentTypeId: string; quantity: number };

export async function createDelivery(items: DeliveryDraftItem[]): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de registar uma entrega." };
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) return { error: "Escolha pelo menos um tipo de peça." };

  const seen = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.garmentTypeId !== "string" || !/^[a-z0-9-]{1,64}$/.test(item.garmentTypeId)) {
      return { error: "Um dos tipos de peça não é válido." };
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      return { error: "As quantidades devem estar entre 1 e 999." };
    }
    if (seen.has(item.garmentTypeId)) return { error: "Cada tipo de peça deve aparecer apenas uma vez." };
    seen.add(item.garmentTypeId);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "A sua sessão terminou. Inicie sessão novamente." };

  const { error } = await supabase.rpc("create_delivery", {
    p_delivered_on: getLisbonDate(),
    p_items: items.map((item) => ({ garment_type_id: item.garmentTypeId, quantity: item.quantity })),
  });

  if (error) return { error: "Não foi possível guardar a entrega. Confirme que tem um pacote ativo e tente novamente." };
  revalidatePath("/");
  return {};
}
