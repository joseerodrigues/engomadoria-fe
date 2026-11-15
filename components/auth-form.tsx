"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type AuthActionState,
} from "@/app/auth/actions";

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

const initialState: AuthActionState = {};

const headings: Record<AuthMode, { title: string; description: string }> = {
  login: { title: "Que bom ter-vos de volta.", description: "Inicie sessão para acompanhar o seu pacote." },
  signup: { title: "O seu cuidado começa aqui.", description: "Crie a sua conta e acompanhe as suas entregas." },
  "forgot-password": { title: "Vamos recuperar o acesso.", description: "Enviaremos um link para o email da sua conta." },
  "reset-password": { title: "Escolha uma nova palavra-passe.", description: "Use pelo menos 8 caracteres." },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const action = mode === "login"
    ? signInAction
    : mode === "signup"
      ? signUpAction
      : mode === "forgot-password"
        ? requestPasswordResetAction
        : updatePasswordAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const heading = headings[mode];

  return (
    <main className="auth-shell">
      <Link href="/" className="brand auth-brand" aria-label="Roupa em Dia, por Engomadoria Gest, início">
        <Image className="brand-mark" src="/icon-192-v2.png" alt="" width={32} height={32} priority />
        <span className="brand-copy"><span className="brand-title">Roupa em Dia</span><small className="brand-provider">por Engomadoria Gest</small></span>
      </Link>
      <section className="auth-card">
        <p className="eyebrow">A SUA CONTA, AO SEU RITMO</p>
        <h1>{heading.title}</h1>
        <p className="auth-description">{heading.description}</p>

        <form action={formAction} className="auth-form">
          {mode === "signup" && <label className="auth-field"><span>Nome</span><input suppressHydrationWarning name="fullName" type="text" autoComplete="name" minLength={2} maxLength={100} required placeholder="O seu nome" /></label>}
          {mode !== "reset-password" && <label className="auth-field"><span>Email</span><input suppressHydrationWarning name="email" type="email" autoComplete="email" required placeholder="nome@email.com" /></label>}
          {(mode === "login" || mode === "signup" || mode === "reset-password") && <label className="auth-field"><span>Palavra-passe</span><input suppressHydrationWarning name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="Pelo menos 8 caracteres" /></label>}

          {state.error && <p className="auth-message error" role="alert">{state.error}</p>}
          {state.success && <p className="auth-message success" role="status">{state.success}</p>}

          <button className="primary-button auth-submit" type="submit" disabled={pending}>
            {pending ? "Aguarde…" : mode === "login" ? "Iniciar sessão" : mode === "signup" ? "Criar conta" : mode === "forgot-password" ? "Enviar link" : "Guardar palavra-passe"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "login" && <><Link href="/forgot-password">Esqueceu-se da palavra-passe?</Link><p>Ainda não tem conta? <Link href="/signup">Criar conta</Link></p></>}
          {mode === "signup" && <p>Já tem conta? <Link href="/login">Iniciar sessão</Link></p>}
          {mode === "forgot-password" && <p>Lembrou-se? <Link href="/login">Voltar ao início de sessão</Link></p>}
          {mode === "reset-password" && <p>O link expirou? <Link href="/forgot-password">Pedir outro link</Link></p>}
        </div>
      </section>
      <p className="auth-footer">Feito com cuidado, em Lisboa <span>♥</span></p>
    </main>
  );
}
