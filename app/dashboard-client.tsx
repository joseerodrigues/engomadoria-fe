"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { createDelivery } from "@/app/deliveries/actions";
import type { DashboardData, Delivery, Garment } from "@/lib/dashboard-data";
import { formatFullDate, formatShortDate } from "@/lib/dates";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></>,
    chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M16 6h4v4"/></>,
    package: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    chevron: <><path d="m7 10 5 5 5-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    shirt: <><path d="m8 4 4 2 4-2 5 3-3 4-2-1v10H8V10l-2 1-3-4 5-3Z"/></>,
    trousers: <><path d="M7 3h10l1 18h-5l-1-8-1 8H6L7 3Z"/><path d="M7 7h10"/></>,
    jacket: <><path d="m8 3 4 2 4-2 4 3-2 5-2-1v11h-8V10l-2 1-2-5 4-3Z"/><path d="m10 4 2 4 2-4M12 8v12"/></>,
    dress: <><path d="m9 3 3 2 3-2 2 5-2 2 4 11H5l4-11-2-2 2-5Z"/><path d="M9 10h6"/></>,
    bedding: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 11h18M8 5v6M12 11v9"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.package}</svg>;
}

function getMonthStart(date: string, monthsAgo: number) {
  const [year, month] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 - monthsAgo, 1));
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function formatMonth(date: string) {
  const [, month] = date.split("-").map(Number);
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${months[month - 1]} ${date.slice(0, 4)}`;
}

function pieceCount(delivery: Delivery) {
  return delivery.items.reduce((total, item) => total + item.quantity, 0);
}

function creditCount(delivery: Delivery) {
  return delivery.items.reduce((total, item) => total + item.quantity * item.creditsPerPiece, 0);
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const dropoffs = data.deliveries;
  const [showForm, setShowForm] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [selectedDropoff, setSelectedDropoff] = useState<Delivery | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [period, setPeriod] = useState("6");
  const [activeNav, setActiveNav] = useState("Visão geral");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const currentDeliveries = dropoffs.filter((delivery) => delivery.date >= data.periodStart && delivery.date <= data.periodEnd);
  const currentCredits = currentDeliveries.reduce((total, delivery) => total + creditCount(delivery), 0);
  const currentPieces = currentDeliveries.reduce((total, delivery) => total + pieceCount(delivery), 0);

  const categoryStats = useMemo(() => {
    const cutoff = getMonthStart(data.periodStart, Number(period) - 1);
    const relevant = dropoffs.filter((delivery) => delivery.date >= cutoff && delivery.date <= data.periodEnd);
    return data.garments.map((garment) => ({
      ...garment,
      count: relevant.reduce((total, delivery) => total + delivery.items
        .filter((item) => item.garmentId === garment.id)
        .reduce((sum, item) => sum + item.quantity, 0), 0),
    })).sort((a, b) => b.count - a.count);
  }, [data.garments, data.periodEnd, data.periodStart, dropoffs, period]);

  const maxCount = Math.max(...categoryStats.map((item) => item.count), 1);
  const mostUsedCategory = categoryStats[0]?.count ? categoryStats[0] : null;
  const progress = data.monthlyCredits ? Math.min(100, (currentCredits / data.monthlyCredits) * 100) : 0;
  const monthLabel = formatMonth(data.periodStart);
  const initials = data.customerName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("pt-PT")).join("");

  function addGarment(garment: Garment, amount: number) {
    setDraft((current) => ({ ...current, [garment.id]: Math.min(999, Math.max(0, (current[garment.id] ?? 0) + amount)) }));
  }

  function saveDropoff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = Object.entries(draft)
      .filter(([, quantity]) => quantity > 0)
      .map(([garmentTypeId, quantity]) => ({ garmentTypeId, quantity }));
    if (!items.length) return;

    setError("");
    startTransition(async () => {
      const result = await createDelivery(items);
      if (result.error) {
        setError(result.error);
        return;
      }

      setDraft({});
      setShowForm(false);
      setNotice("Utilização registada com sucesso");
      window.setTimeout(() => setNotice(""), 3200);
      router.refresh();
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a href="#top" className="brand" aria-label="Fio a Fio, início">
          <span className="brand-mark"><Icon name="sparkle" size={20} /></span>
          <span>fio<span className="brand-light">a</span>fio</span>
        </a>
        <div className="workspace-label">A MINHA CONTA</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {[{ label: "Visão geral", icon: "home", href: "#top" }, { label: "O meu pacote", icon: "package", href: "#package" }, { label: "Estatísticas", icon: "chart", href: "#statistics" }].map((item) => (
            <a key={item.label} href={item.href} onClick={() => setActiveNav(item.label)} aria-current={activeNav === item.label ? "page" : undefined} className={`nav-link ${activeNav === item.label ? "active" : ""}`}>
              <Icon name={item.icon} size={19} /><span>{item.label}</span>{item.label === "Visão geral" && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><Icon name="sparkle" size={17} /></span><strong>Um cuidado a cada peça.</strong><p>A sua roupa, tratada com todo o carinho.</p><a href="mailto:ola@fioafio.pt">Precisa de ajuda? <Icon name="arrow" size={13} /></a></div>
          <form action={signOutAction} className="profile-form"><button className="profile-button" type="submit"><span className="avatar">{initials}</span><span className="profile-copy"><b>{data.customerName}</b><small>{data.email}</small></span><span className="signout-label">Sair</span></button></form>
        </div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar">
          <div className="breadcrumbs">A minha conta <span>/</span> <b>{activeNav}</b></div>
          <div className="topbar-right"><span className="topbar-message"><span className="status-dot" />Tudo em dia</span><span className="mobile-avatar" aria-label={`Perfil ${data.customerName}`}>{initials}</span></div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div><p className="eyebrow"><Icon name="sun" size={15} /> O SEU MÊS DE {monthLabel.split(" ")[0].toLocaleUpperCase("pt-PT")}</p><h1>Bom dia, {data.customerName.split(" ")[0]}<span className="wave">✳</span></h1><p className="welcome-subtitle">A sua roupa está em boas mãos. Veja como vai o seu mês.</p></div>
            <button className="primary-button" onClick={() => setShowForm(true)} disabled={!data.packageName}><Icon name="plus" size={18} />Registar utilização</button>
          </section>

          <section className="overview-grid" aria-label="Resumo do pacote">
            <article className="usage-card" id="package">
              <div className="usage-card-top"><div><span className="card-eyebrow light">O MEU PACOTE <span className="current-pill">{data.packageName ? "ATIVO" : "SEM PACOTE"}</span></span><h2>{data.packageName ?? "Pacote por atribuir"}</h2><p>{data.packageName ? "O seu ritmo, ao seu cuidado." : "Contacte-nos para ativar o seu pacote."}</p></div><div className="package-icon"><Icon name="package" size={24} /></div></div>
              <div className="usage-divider" />
              <div className="usage-numbers"><div><strong>{currentCredits}<span> / {data.monthlyCredits}</span></strong><small>créditos utilizados</small></div><div className="remaining"><strong>{Math.max(0, data.monthlyCredits - currentCredits)}</strong><small>créditos disponíveis</small></div></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <div className="usage-foot"><span><Icon name="calendar" size={14} /> {formatShortDate(data.periodStart)} – {formatShortDate(data.periodEnd)} {data.periodEnd.slice(0, 4)}</span><span>{Math.round(progress)}% utilizado</span></div>
            </article>

            <article className="stat-card"><div className="stat-card-head"><span className="stat-icon lilac"><Icon name="shirt" size={19} /></span><span className="stat-trend">ESTE MÊS</span></div><strong className="stat-value">{currentPieces}<small> peças</small></strong><p>em {currentDeliveries.length} entregas</p><div className="mini-bars" aria-hidden="true"><i style={{ height: "36%" }} /><i style={{ height: "52%" }} /><i style={{ height: "43%" }} /><i style={{ height: "69%" }} /><i style={{ height: "56%" }} /><i style={{ height: "86%" }} /><i className="bar-active" style={{ height: "72%" }} /></div><div className="stat-caption">Peças cuidadas este mês</div></article>

            <article className="stat-card next-card"><div className="stat-card-head"><span className="stat-icon peach"><Icon name="clock" size={19} /></span><span className="stat-trend">A PRÓXIMA</span></div><strong className="next-date">A sua próxima<br />entrega começa aqui.</strong><p>Registe quando deixar a roupa.</p><button className="text-button" onClick={() => setShowForm(true)} disabled={!data.packageName}>Adicionar entrega <Icon name="arrow" size={15} /></button></article>
          </section>

          <section className="content-grid">
            <article className="panel activity-panel">
              <div className="panel-heading"><div><h2>Histórico de entregas</h2><p>Um olhar sobre as suas últimas entregas.</p></div><button className="quiet-button" onClick={() => setShowAllActivity((value) => !value)}>{showAllActivity ? "Ver menos" : "Ver tudo"} <Icon name="arrow" size={14} /></button></div>
              <div className="activity-list" id="activity-list">
                {dropoffs.length === 0 && <p className="empty-activity">Ainda não tem entregas. Registe a primeira quando deixar roupa para engomar.</p>}
                {dropoffs.slice(0, showAllActivity ? dropoffs.length : 4).map((delivery) => {
                  const description = delivery.items.map((item) => `${item.quantity} ${item.name.toLocaleLowerCase("pt-PT")}`).join(", ");
                  return <button type="button" className="activity-item" key={delivery.id} aria-label={`Ver entrega de ${formatShortDate(delivery.date)}: ${description}`} onClick={() => setSelectedDropoff(delivery)}><span className="activity-icon"><Icon name="package" size={17} /></span><span className="activity-copy"><strong>Entrega de roupa</strong><span>{description || "Sem peças"}</span></span><span className="activity-meta"><strong>{pieceCount(delivery)} peças <span>·</span> {creditCount(delivery)} créditos</strong><small>{formatShortDate(delivery.date)}</small></span><span className="activity-open" aria-hidden="true"><Icon name="arrow" size={14} /></span></button>;
                })}
              </div>
              {dropoffs.length > 4 && <button className="mobile-see-all" onClick={() => setShowAllActivity((value) => !value)}>{showAllActivity ? "Ver menos" : "Ver toda a atividade"} <Icon name="arrow" size={14} /></button>}
            </article>

            <article className="panel category-panel" id="statistics">
              <div className="panel-heading category-heading"><div><h2>O que mais cuidamos</h2><p>Peças por categoria</p></div><label className="select-wrap"><span className="sr-only">Período das estatísticas</span><select suppressHydrationWarning value={period} onChange={(event) => setPeriod(event.target.value)}>{[{ value: "3", label: "Últimos 3 meses" }, { value: "6", label: "Últimos 6 meses" }, { value: "12", label: "Últimos 12 meses" }].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevron" size={14} /></label></div>
              <div className="category-chart">{categoryStats.map((item) => <div className="category-row" key={item.id}><span className={`category-symbol symbol-${item.id}`}><Icon name={item.icon} size={16} /></span><span className="category-name">{item.name}</span><span className="category-bar"><i style={{ width: `${(item.count / maxCount) * 100}%` }} /></span><strong className="category-count">{item.count}</strong></div>)}</div>
              <div className="category-note"><span className="note-sparkle"><Icon name="sparkle" size={15} /></span><p>{mostUsedCategory ? <><strong>O seu cuidado tem um padrão.</strong> {mostUsedCategory.name} são a categoria mais cuidada neste período.</> : "As suas estatísticas aparecem aqui depois da primeira entrega."}</p></div>
            </article>
          </section>

          <footer className="page-footer"><span>Feito com cuidado, em Lisboa <span className="footer-heart">♥</span></span><span>© 2026 Fio a Fio</span></footer>
        </div>
      </section>

      {notice && <div className="toast" role="status"><span><Icon name="check" size={17} /></span>{notice}</div>}

      {selectedDropoff && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDropoff(null); }}><section className="usage-modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="delivery-title"><div className="modal-heading"><div><span className="eyebrow"><Icon name="calendar" size={14} /> ENTREGA · {formatFullDate(selectedDropoff.date).toLocaleUpperCase("pt-PT")}</span><h2 id="delivery-title">Detalhe da entrega</h2><p>Peças incluídas nesta utilização.</p></div><button className="close-button" onClick={() => setSelectedDropoff(null)} aria-label="Fechar detalhe da entrega"><Icon name="close" size={19} /></button></div><div className="delivery-detail-items">{selectedDropoff.items.map((item) => <div className="delivery-detail-item" key={item.garmentId}><span className={`garment-option-icon symbol-${item.garmentId}`}><Icon name={data.garments.find((garment) => garment.id === item.garmentId)?.icon ?? "package"} size={18} /></span><span className="garment-option-name"><strong>{item.name}</strong><small>{item.creditsPerPiece} {item.creditsPerPiece === 1 ? "crédito" : "créditos"} por peça</small></span><strong className="delivery-detail-count">{item.quantity} <small>× {item.creditsPerPiece}</small></strong><strong className="delivery-detail-subtotal">{item.quantity * item.creditsPerPiece}</strong></div>)}</div><div className="delivery-detail-total"><span>{pieceCount(selectedDropoff)} peças entregues</span><strong>{creditCount(selectedDropoff)} créditos</strong></div></section></div>}

      {showForm && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setShowForm(false); }}><section className="usage-modal" role="dialog" aria-modal="true" aria-labelledby="usage-title"><div className="modal-heading"><div><span className="eyebrow">A SUA CONTA, AO SEU RITMO</span><h2 id="usage-title">Registar utilização</h2><p>Que peças deixou para cuidar hoje?</p></div><button className="close-button" onClick={() => setShowForm(false)} disabled={pending} aria-label="Fechar"><Icon name="close" size={19} /></button></div><form onSubmit={saveDropoff}><div className="garment-options">{data.garments.filter((garment) => garment.active).map((garment) => <div className="garment-option" key={garment.id}><span className={`garment-option-icon symbol-${garment.id}`}><Icon name={garment.icon} size={18} /></span><span className="garment-option-name"><strong>{garment.name}</strong><small>{garment.slots} {garment.slots === 1 ? "crédito" : "créditos"} por peça</small></span><div className="quantity-control"><button type="button" onClick={() => addGarment(garment, -1)} aria-label={`Remover ${garment.singular}`}>−</button><span>{draft[garment.id] ?? 0}</span><button type="button" onClick={() => addGarment(garment, 1)} aria-label={`Adicionar ${garment.singular}`}>+</button></div></div>)}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-summary"><span>Créditos desta entrega</span><strong>{data.garments.filter((garment) => garment.active).reduce((sum, garment) => sum + (draft[garment.id] ?? 0) * garment.slots, 0)}</strong></div><button className="primary-button modal-submit" type="submit" disabled={pending || !Object.values(draft).some((quantity) => quantity > 0)}>{pending ? "A guardar…" : "Guardar utilização"} <Icon name="arrow" size={16} /></button><p className="modal-footnote"><Icon name="sparkle" size={14} /> A sua utilização atualiza-se assim que guardar.</p></form></section></div>}
    </main>
  );
}
