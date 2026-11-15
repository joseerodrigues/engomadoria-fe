import { AuthForm } from "@/components/auth-form";
import { SupabaseSetup } from "@/components/supabase-setup";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetPasswordPage() {
  return isSupabaseConfigured() ? <AuthForm mode="reset-password" /> : <SupabaseSetup />;
}
