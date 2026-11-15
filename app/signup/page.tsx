import { AuthForm } from "@/components/auth-form";
import { SupabaseSetup } from "@/components/supabase-setup";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  return isSupabaseConfigured() ? <AuthForm mode="signup" /> : <SupabaseSetup />;
}
