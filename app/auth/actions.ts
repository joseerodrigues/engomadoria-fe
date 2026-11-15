"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string; success?: string };

async function getEmailRedirectUrl(next: string) {
  const requestHeaders = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? requestHeaders.get("origin") ?? "http://localhost:3000";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);
  return callback.toString();
}

function getEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

export async function signInAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de iniciar sessão." };

  const email = getEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Introduza o email e a palavra-passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Não foi possível iniciar sessão. Verifique os seus dados e tente novamente." };

  redirect("/");
}

export async function signUpAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de criar uma conta." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = getEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (fullName.length < 2) return { error: "Introduza o seu nome." };
  if (!email || !email.includes("@")) return { error: "Introduza um email válido." };
  if (password.length < 8) return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: await getEmailRedirectUrl("/"),
    },
  });

  if (error) return { error: "Não foi possível criar a conta com estes dados. Tente novamente." };
  if (!data.session) return { success: "Conta criada. Confirme o seu email para iniciar sessão." };

  redirect("/");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function requestPasswordResetAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de recuperar a palavra-passe." };

  const email = getEmail(formData);
  if (!email || !email.includes("@")) return { error: "Introduza um email válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: await getEmailRedirectUrl("/reset-password") });
  return { success: "Se existir uma conta para este email, receberá uma mensagem com os próximos passos." };
}

export async function updatePasswordAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Configure a ligação ao Supabase antes de alterar a palavra-passe." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar a palavra-passe. Peça um novo link de recuperação." };

  redirect("/");
}
