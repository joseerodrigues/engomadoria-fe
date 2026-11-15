import Image from "next/image";

export function SupabaseSetup() {
  return (
    <main className="setup-shell">
      <div className="setup-card">
        <Image className="brand-mark" src="/icon-192-v2.png" alt="" width={32} height={32} priority />
        <p className="eyebrow">CONFIGURAÇÃO INICIAL</p>
        <h1>Ligue a sua base de dados.</h1>
        <p>Para guardar contas e entregas, configure um projeto Supabase:</p>
        <ol>
          <li>Copie <code>.env.example</code> para <code>.env.local</code> e preencha o URL e a chave publicável do projeto.</li>
          <li>Execute <code>supabase/migrations/20261115000000_initial_schema.sql</code> no SQL Editor do projeto.</li>
          <li>Reinicie o servidor de desenvolvimento.</li>
        </ol>
        <p className="setup-note">As chaves ficam no ambiente local; não as adicione ao Git.</p>
      </div>
    </main>
  );
}
