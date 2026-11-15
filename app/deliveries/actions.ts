"use server";

import { revalidatePath } from "next/cache";
import { getLisbonDate } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type DeliveryDraftItem = { garmentTypeId: string; quantity: number };

function validateItems(items: DeliveryDraftItem[]) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) return "Escolha pelo menos um tipo de peça.";

  const seen = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.garmentTypeId !== "string" || !/^[a-z0-9-]{1,64}$/.test(item.garmentTypeId)) {
      return "Um dos tipos de peça não é válido.";
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      return "As quantidades devem estar entre 1 e 999.";
    }
    if (seen.has(item.garmentTypeId)) return "Cada tipo de peça deve aparecer apenas uma vez.";
    seen.add(item.garmentTypeId);
  }
}

function toRpcItems(items: DeliveryDraftItem[]) {
  return items.map((item) => ({ garment_type_id: item.garmentTypeId, quantity: item.quantity }));
}

function getRpcError(error: { code?: string } | null, genericMessage: string) {
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return "A base de dados precisa das migrações mais recentes. Execute novamente os ficheiros SQL em supabase/migrations/ no Supabase.";
  }
  return genericMessage;
}

export async function createDelivery(items: DeliveryDraftItem[]): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de registar uma entrega." };
  const validationError = validateItems(items);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "A sua sessão terminou. Inicie sessão novamente." };

  const { error } = await supabase.rpc("create_delivery", {
    p_delivered_on: getLisbonDate(),
    p_items: toRpcItems(items),
  });

  if (error) return { error: getRpcError(error, "Não foi possível guardar a entrega. Confirme que tem um pacote ativo e tente novamente.") };
  revalidatePath("/");
  return {};
}

export async function updateDelivery(
  deliveryId: string,
  deliveredOn: string,
  items: DeliveryDraftItem[],
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de editar uma entrega." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deliveryId)) {
    return { error: "A entrega selecionada não é válida." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveredOn) || deliveredOn > getLisbonDate()) {
    return { error: "Escolha uma data de entrega válida." };
  }
  const validationError = validateItems(items);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "A sua sessão terminou. Inicie sessão novamente." };

  const { error } = await supabase.rpc("update_delivery", {
    p_delivery_id: deliveryId,
    p_delivered_on: deliveredOn,
    p_items: toRpcItems(items),
  });

  if (error) return { error: getRpcError(error, "Não foi possível atualizar a entrega. Confirme a data e as peças e tente novamente.") };
  revalidatePath("/");
  return {};
}

export async function deleteDelivery(deliveryId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de eliminar uma entrega." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deliveryId)) {
    return { error: "A entrega selecionada não é válida." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "A sua sessão terminou. Inicie sessão novamente." };

  const { error } = await supabase.rpc("delete_delivery", { p_delivery_id: deliveryId });
  if (error) return { error: getRpcError(error, "Não foi possível eliminar a entrega. Atualize a página e tente novamente.") };
  revalidatePath("/");
  return {};
}
