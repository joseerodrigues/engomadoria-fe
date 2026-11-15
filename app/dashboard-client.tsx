"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { createDelivery, deleteDelivery, updateDelivery } from "@/app/deliveries/actions";
import { switchPlan } from "@/app/plans/actions";
import type { DashboardData, Delivery, Garment } from "@/lib/dashboard-data";
import { formatFullDate, formatShortDate } from "@/lib/dates";

type MobileTab = "home" | "deliveries" | "statistics" | "account";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></>,
    chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M16 6h4v4"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6"/><path d="M10 11v5m4-5v5"/></>,
    package: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    chevron: <><path d="m7 10 5 5 5-5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    warning: <><path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3l-8.1-14.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/></>,
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

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCalendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return { day, date: `${monthKey}-${String(day).padStart(2, "0")}` };
  });
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
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [selectedDropoff, setSelectedDropoff] = useState<Delivery | null>(null);
  const [editingDropoff, setEditingDropoff] = useState<Delivery | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(data.today);
  const [calendarMonth, setCalendarMonth] = useState(data.today.slice(0, 7));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [period, setPeriod] = useState("6");
  const [activeNav, setActiveNav] = useState("Visão geral");
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [pending, startTransition] = useTransition();

  const currentDeliveries = dropoffs.filter((delivery) => delivery.date >= data.periodStart && delivery.date <= data.periodEnd);
  const currentCredits = currentDeliveries.reduce((total, delivery) => total + creditCount(delivery), 0);
  const currentPieces = currentDeliveries.reduce((total, delivery) => total + pieceCount(delivery), 0);
  const overPlanLimit = data.monthlyCredits > 0 && currentCredits > data.monthlyCredits;
  const draftCredits = data.garments.reduce((sum, garment) => sum + (draft[garment.id] ?? 0) * garment.slots, 0);
  const editingCurrentPeriod = Boolean(editingDropoff && editingDropoff.date >= data.periodStart && editingDropoff.date <= data.periodEnd);
  const currentCreditsBeforeDraft = currentCredits - (editingCurrentPeriod && editingDropoff ? creditCount(editingDropoff) : 0);
  const deliveryDateIsCurrentPeriod = deliveryDate >= data.periodStart && deliveryDate <= data.periodEnd;
  const draftExceedsCurrentPlan = deliveryDateIsCurrentPeriod
    && data.monthlyCredits > 0
    && currentCreditsBeforeDraft + draftCredits > data.monthlyCredits;

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
  const calendarDays = getCalendarDays(calendarMonth);

  function addGarment(garment: Garment, amount: number) {
    setDraft((current) => ({ ...current, [garment.id]: Math.min(999, Math.max(0, (current[garment.id] ?? 0) + amount)) }));
  }

  function canAddGarment(garment: Garment) {
    if ((draft[garment.id] ?? 0) >= 999 || data.monthlyCredits <= 0) return false;
    return !deliveryDateIsCurrentPeriod || currentCreditsBeforeDraft + draftCredits + garment.slots <= data.monthlyCredits;
  }

  function saveDropoff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = Object.entries(draft)
      .filter(([, quantity]) => quantity > 0)
      .map(([garmentTypeId, quantity]) => ({ garmentTypeId, quantity }));
    if (!items.length) return;

    setError("");
    startTransition(async () => {
      const result = editingDropoff
        ? await updateDelivery(editingDropoff.id, deliveryDate, items)
        : await createDelivery(items, deliveryDate);
      if (result.error) {
        setError(result.error);
        return;
      }

      setDraft({});
      setEditingDropoff(null);
      setDeliveryDate(data.today);
      setShowForm(false);
      setNotice(editingDropoff ? "Entrega atualizada com sucesso" : "Utilização registada com sucesso");
      window.setTimeout(() => setNotice(""), 3200);
      router.refresh();
    });
  }

  function editDropoff(delivery: Delivery) {
    setDraft(Object.fromEntries(delivery.items.map((item) => [item.garmentId, item.quantity])));
    setDeliveryDate(delivery.date);
    setCalendarMonth(delivery.date.slice(0, 7));
    setCalendarOpen(false);
    setEditingDropoff(delivery);
    setSelectedDropoff(null);
    setError("");
    setShowForm(true);
  }

  function newDropoff() {
    setDraft({});
    setEditingDropoff(null);
    setDeliveryDate(data.today);
    setCalendarMonth(data.today.slice(0, 7));
    setCalendarOpen(false);
    setError("");
    setShowForm(true);
  }

  function removeDropoff(delivery: Delivery) {
    setError("");
    startTransition(async () => {
      const result = await deleteDelivery(delivery.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelectedDropoff(null);
      setConfirmDelete(false);
      setNotice("Entrega eliminada");
      window.setTimeout(() => setNotice(""), 3200);
      router.refresh();
    });
  }

  function requestDeleteDropoff(delivery: Delivery) {
    setSelectedDropoff(delivery);
    setConfirmDelete(true);
    setError("");
  }

  function choosePlan(planId: string) {
    setPlanError("");
    startTransition(async () => {
      const result = await switchPlan(planId);
      if (result.error) {
        setPlanError(result.error);
        return;
      }
      setShowPlanPicker(false);
      setNotice("O seu pacote foi atualizado");
      window.setTimeout(() => setNotice(""), 3200);
      router.refresh();
    });
  }

  return (
    <main className="app-shell" data-mobile-tab={mobileTab} data-flow={showForm || showPlanPicker || selectedDropoff ? "true" : "false"}>
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
          <div className="breadcrumbs">A minha conta <span>/</span> <b>{{ home: "Visão geral", deliveries: "Entregas", statistics: "Estatísticas", account: "Conta" }[mobileTab] ?? activeNav}</b></div>
          <div className="topbar-right"><span className="topbar-message"><span className="status-dot" />Tudo em dia</span><button className="mobile-add-button" onClick={newDropoff} disabled={!data.packageName}><Icon name="plus" size={18} /> Nova entrega</button><span className="mobile-avatar" aria-label={`Perfil ${data.customerName}`}>{initials}</span></div>
        </header>

        <div className="page-content">
          {notice && <p className="inline-notice" role="status"><Icon name="check" size={17} />{notice}</p>}
          <section className="welcome-row">
            <div><p className="eyebrow"><Icon name="sun" size={15} /> O SEU MÊS DE {monthLabel.split(" ")[0].toLocaleUpperCase("pt-PT")}</p><h1>Bom dia, {data.customerName.split(" ")[0]}<span className="wave">✳</span></h1><p className="welcome-subtitle">A sua roupa está em boas mãos. Veja como vai o seu mês.</p></div>
            <button className="primary-button" onClick={newDropoff} disabled={!data.packageName}><Icon name="plus" size={18} />Registar utilização</button>
          </section>

          <section className="overview-grid" aria-label="Resumo do pacote">
            <article className={`usage-card ${overPlanLimit ? "usage-over-limit" : ""}`} id="package">
              <div className="usage-card-top"><div><span className="card-eyebrow light">O MEU PACOTE <span className="current-pill">{data.packageName ? "ATIVO" : "SEM PACOTE"}</span></span><h2>{data.packageName ?? "Pacote por atribuir"}</h2><p>{data.packageName ? "O seu ritmo, ao seu cuidado." : "Escolha um pacote para começar."}</p>{data.packageStartedOn && <p className="package-validity">Ativo desde {formatShortDate(data.packageStartedOn)} · expira {data.packageExpiresOn ? formatShortDate(data.packageExpiresOn) : "sem data definida"} {data.packageExpiresOn?.slice(0, 4)}</p>}<button className="plan-change-button" type="button" onClick={() => { setPlanError(""); setShowPlanPicker(true); }}>{data.packageName ? "Mudar pacote" : "Escolher pacote"} <Icon name="arrow" size={15} /></button></div><div className="package-icon"><Icon name="package" size={24} /></div></div>
              <div className="usage-divider" />
              <div className="usage-numbers"><div><strong className={overPlanLimit ? "credit-over-limit" : ""}>{currentCredits}<span> / {data.monthlyCredits}</span></strong><small>créditos utilizados</small></div><div className="remaining"><strong>{Math.max(0, data.monthlyCredits - currentCredits)}</strong><small>créditos disponíveis</small></div></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              {overPlanLimit && <p className="usage-warning" role="alert"><Icon name="warning" size={17} /> Excedeu o limite do pacote em {currentCredits - data.monthlyCredits} créditos.</p>}
              <div className="usage-foot"><span><Icon name="calendar" size={14} /> {formatShortDate(data.periodStart)} – {formatShortDate(data.periodEnd)} {data.periodEnd.slice(0, 4)}</span><span>{Math.round(progress)}% utilizado</span></div>
            </article>

            <article className="stat-card"><div className="stat-card-head"><span className="stat-icon lilac"><Icon name="shirt" size={19} /></span><span className="stat-trend">ESTE MÊS</span></div><strong className="stat-value">{currentPieces}<small> peças</small></strong><p>em {currentDeliveries.length} entregas</p><div className="mini-bars" aria-hidden="true"><i style={{ height: "36%" }} /><i style={{ height: "52%" }} /><i style={{ height: "43%" }} /><i style={{ height: "69%" }} /><i style={{ height: "56%" }} /><i style={{ height: "86%" }} /><i className="bar-active" style={{ height: "72%" }} /></div><div className="stat-caption">Peças cuidadas este mês</div></article>

            <article className="stat-card next-card"><div className="stat-card-head"><span className="stat-icon peach"><Icon name="clock" size={19} /></span><span className="stat-trend">A PRÓXIMA</span></div><strong className="next-date">A sua próxima<br />entrega começa aqui.</strong><p>Registe quando deixar a roupa.</p><button className="text-button" onClick={newDropoff} disabled={!data.packageName}>Adicionar entrega <Icon name="arrow" size={15} /></button></article>
          </section>

          <section className="content-grid">
            <article className="panel activity-panel">
              <div className="panel-heading"><div><h2>Histórico de entregas</h2><p>Um olhar sobre as suas últimas entregas.</p></div><button className="quiet-button" onClick={() => setShowAllActivity((value) => !value)}>{showAllActivity ? "Ver menos" : "Ver tudo"} <Icon name="arrow" size={14} /></button></div>
              <div className="activity-list" id="activity-list">
                {dropoffs.length === 0 && <p className="empty-activity">Ainda não tem entregas. Registe a primeira quando deixar roupa para engomar.</p>}
                {dropoffs.slice(0, showAllActivity ? dropoffs.length : 4).map((delivery) => {
                  const description = delivery.items.map((item) => `${item.quantity} ${item.name.toLocaleLowerCase("pt-PT")}`).join(", ");
                  return <div className="activity-row" key={delivery.id}><button type="button" className="activity-item" aria-label={`Ver entrega de ${formatShortDate(delivery.date)}: ${description}`} onClick={() => setSelectedDropoff(delivery)}><span className="activity-icon"><Icon name="package" size={17} /></span><span className="activity-copy"><strong>Entrega de roupa</strong><span>{description || "Sem peças"}</span></span><span className="activity-meta"><strong>{pieceCount(delivery)} peças <span>·</span> {creditCount(delivery)} créditos</strong><small>{formatShortDate(delivery.date)}</small></span><span className="activity-open" aria-hidden="true"><Icon name="arrow" size={14} /></span></button><div className="activity-row-actions"><button type="button" className="icon-action edit-action" onClick={() => editDropoff(delivery)} aria-label="Editar entrega" title="Editar entrega"><Icon name="edit" size={17} /></button><button type="button" className="icon-action delete-action" onClick={() => requestDeleteDropoff(delivery)} aria-label="Eliminar entrega" title="Eliminar entrega"><Icon name="trash" size={17} /></button></div></div>;
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

          <section className="panel account-panel">
            <p className="eyebrow">A SUA CONTA</p>
            <div className="account-details"><span className="avatar">{initials}</span><div><h2>{data.customerName}</h2><p>{data.email}</p><p>{data.packageName ?? "Sem pacote ativo"}</p></div></div>
            <form action={signOutAction}><button className="secondary-button" type="submit">Terminar sessão</button></form>
          </section>

          <footer className="page-footer"><span>Feito com cuidado, em Lisboa <span className="footer-heart">♥</span></span><span>© 2026 Fio a Fio</span></footer>
        </div>
      </section>

      <nav className="mobile-tabs" aria-label="Navegação principal">
        {[{ id: "home", label: "Início", icon: "home" }, { id: "deliveries", label: "Entregas", icon: "list" }, { id: "statistics", label: "Estatísticas", icon: "chart" }, { id: "account", label: "Conta", icon: "user" }].map((tab) => (
          <button key={tab.id} type="button" onClick={() => setMobileTab(tab.id as MobileTab)} className={mobileTab === tab.id ? "active" : ""} aria-current={mobileTab === tab.id ? "page" : undefined}><Icon name={tab.icon} size={21} /><span>{tab.label}</span></button>
        ))}
      </nav>

      {selectedDropoff && <section className="flow-screen" aria-labelledby="delivery-title">
        <button className="flow-back" type="button" onClick={() => { setSelectedDropoff(null); setConfirmDelete(false); setError(""); }}><Icon name="arrow" size={18} /> Voltar às entregas</button>
        <div className="flow-content"><p className="eyebrow">ENTREGA · {formatFullDate(selectedDropoff.date).toLocaleUpperCase("pt-PT")}</p><h1 id="delivery-title">Detalhe da entrega</h1><p className="flow-description">Peças incluídas nesta utilização.</p>
          <div className="delivery-detail-items">{selectedDropoff.items.map((item) => <div className="delivery-detail-item" key={item.garmentId}><span className={`garment-option-icon symbol-${item.garmentId}`}><Icon name={data.garments.find((garment) => garment.id === item.garmentId)?.icon ?? "package"} size={20} /></span><span className="garment-option-name"><strong>{item.name}</strong><small>{item.creditsPerPiece} {item.creditsPerPiece === 1 ? "crédito" : "créditos"} por peça</small></span><strong className="delivery-detail-count">{item.quantity} <small>× {item.creditsPerPiece}</small></strong><strong className="delivery-detail-subtotal">{item.quantity * item.creditsPerPiece}</strong></div>)}</div>
          <div className="delivery-detail-total"><span>{pieceCount(selectedDropoff)} peças entregues</span><strong>{creditCount(selectedDropoff)} créditos</strong></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {confirmDelete ? <div className="delete-confirm"><p>Eliminar esta entrega e todas as peças registadas?</p><button className="secondary-button" type="button" onClick={() => setConfirmDelete(false)}>Cancelar</button><button className="danger-button" type="button" disabled={pending} onClick={() => removeDropoff(selectedDropoff)}>{pending ? "A eliminar…" : "Confirmar eliminação"}</button></div> : <div className="delivery-actions"><button className="primary-button" type="button" onClick={() => editDropoff(selectedDropoff)} aria-label="Editar entrega" title="Editar entrega"><Icon name="edit" size={18} /><span className="desktop-action-label">Editar entrega</span></button><button className="danger-button" type="button" onClick={() => setConfirmDelete(true)} aria-label="Eliminar entrega" title="Eliminar entrega"><Icon name="trash" size={18} /><span className="desktop-action-label">Eliminar entrega</span></button></div>}
        </div>
      </section>}

      {showPlanPicker && <section className="flow-screen" aria-labelledby="plan-title">
        <button className="flow-back" type="button" disabled={pending} onClick={() => setShowPlanPicker(false)}><Icon name="arrow" size={18} /> Voltar ao pacote</button>
        <div className="flow-content"><p className="eyebrow">O SEU PACOTE</p><h1 id="plan-title">Escolha o seu ritmo</h1><p className="flow-description">A alteração entra em vigor hoje. As entregas já registadas neste mês continuam a contar para o limite do novo pacote.</p>
          {planError && <p className="form-error" role="alert">{planError}</p>}
          <div className="plan-options">{data.plans.filter((plan) => plan.active).map((plan) => {
            const current = plan.id === data.currentPlanId;
            return <button className={`plan-option ${current ? "current" : ""}`} key={plan.id} type="button" disabled={pending || current} aria-pressed={current} onClick={() => choosePlan(plan.id)}><span className="plan-option-copy"><strong>{plan.name}</strong><small>{plan.monthlyCredits} créditos por mês · {plan.durationMonths} {plan.durationMonths === 1 ? "mês" : "meses"}</small></span><span className="plan-option-action">{current ? "Pacote atual" : pending ? "A atualizar…" : "Escolher"}</span></button>;
          })}</div>
        </div>
      </section>}

      {showForm && <section className="flow-screen" aria-labelledby="usage-title">
        <button className="flow-back" type="button" disabled={pending} onClick={() => { setShowForm(false); setEditingDropoff(null); setError(""); }}><Icon name="arrow" size={18} /> Voltar</button>
        <div className="flow-content"><p className="eyebrow">A SUA CONTA, AO SEU RITMO</p><h1 id="usage-title">{editingDropoff ? "Editar entrega" : "Registar utilização"}</h1><p className="flow-description">Que peças deixou para cuidar {editingDropoff ? "nesta entrega" : "hoje"}?</p>
          <form onSubmit={saveDropoff} className="flow-form">
            <div className="delivery-date-field">
              <span>Data da entrega</span>
              <button className="date-picker-value" type="button" aria-expanded={calendarOpen} aria-controls="delivery-calendar" onClick={() => setCalendarOpen((open) => !open)}><Icon name="calendar" size={20} /><span><small>Data selecionada</small><strong>{formatFullDate(deliveryDate)}</strong></span><Icon name="chevron" size={17} /></button>
              {calendarOpen && <div className="date-calendar" id="delivery-calendar">
                <div className="date-calendar-heading"><button type="button" className="calendar-month-button previous" aria-label="Mês anterior" onClick={() => setCalendarMonth((month) => shiftMonth(month, -1))}><Icon name="arrow" size={18} /></button><strong>{formatMonth(`${calendarMonth}-01`)}</strong><button type="button" className="calendar-month-button" aria-label="Mês seguinte" disabled={calendarMonth >= data.today.slice(0, 7)} onClick={() => setCalendarMonth((month) => shiftMonth(month, 1))}><Icon name="arrow" size={18} /></button></div>
                <div className="date-calendar-grid date-calendar-weekdays" aria-hidden="true">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => <span key={day}>{day}</span>)}</div>
                <div className="date-calendar-grid date-calendar-days">{calendarDays.map((entry, index) => entry ? <button key={entry.date} type="button" disabled={entry.date > data.today} aria-label={formatFullDate(entry.date)} aria-pressed={deliveryDate === entry.date} className={`${deliveryDate === entry.date ? "selected" : ""} ${entry.date === data.today ? "today" : ""}`} onClick={() => { setDeliveryDate(entry.date); setCalendarOpen(false); }}>{entry.day}</button> : <span key={`empty-${calendarMonth}-${index}`} aria-hidden="true" />)}</div>
              </div>}
            </div>
            <div className="garment-options">{data.garments.filter((garment) => garment.active || editingDropoff?.items.some((item) => item.garmentId === garment.id)).map((garment) => <div className="garment-option" key={garment.id}><span className={`garment-option-icon symbol-${garment.id}`}><Icon name={garment.icon} size={20} /></span><span className="garment-option-name"><strong>{garment.name}</strong><small>{garment.slots} {garment.slots === 1 ? "crédito" : "créditos"} por peça</small></span><div className="quantity-control"><button type="button" disabled={(draft[garment.id] ?? 0) === 0} onClick={() => addGarment(garment, -1)} aria-label={`Remover ${garment.singular}`}>−</button><span>{draft[garment.id] ?? 0}</span><button type="button" disabled={!canAddGarment(garment)} onClick={() => addGarment(garment, 1)} aria-label={`Adicionar ${garment.singular}`}>+</button></div></div>)}</div>
            {draftExceedsCurrentPlan && <p className="form-error" role="alert">Esta entrega excede os créditos disponíveis neste período. Reduza as quantidades ou mude para um pacote maior.</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-summary"><span>Créditos desta entrega</span><strong>{draftCredits}</strong></div><button className="primary-button modal-submit" type="submit" disabled={pending || draftCredits <= 0 || draftExceedsCurrentPlan}>{pending ? "A guardar…" : editingDropoff ? "Guardar alterações" : "Guardar utilização"} <Icon name="arrow" size={17} /></button>
          </form>
        </div>
      </section>}
    </main>
  );
}
