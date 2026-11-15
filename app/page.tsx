"use client";

import { useMemo, useState } from "react";

type GarmentId = "shirt" | "trousers" | "jacket" | "dress" | "bedding";
type Garment = { id: GarmentId; name: string; singular: string; slots: number; icon: string };
type Dropoff = { id: number; date: string; items: Partial<Record<GarmentId, number>> };

const garments: Garment[] = [
  { id: "shirt", name: "Camisas", singular: "Camisa", slots: 1, icon: "shirt" },
  { id: "trousers", name: "Calças", singular: "Calça", slots: 1, icon: "trousers" },
  { id: "jacket", name: "Casacos", singular: "Casaco", slots: 2, icon: "jacket" },
  { id: "dress", name: "Vestidos", singular: "Vestido", slots: 2, icon: "dress" },
  { id: "bedding", name: "Roupa de cama", singular: "Peça de cama", slots: 3, icon: "bedding" },
];

const currentMonth = "2026-11";
const initialDropoffs: Dropoff[] = [
  { id: 1, date: "2026-11-12", items: { shirt: 3, trousers: 2 } },
  { id: 2, date: "2026-11-08", items: { shirt: 2, jacket: 1 } },
  { id: 3, date: "2026-11-03", items: { shirt: 1, trousers: 2, dress: 1 } },
  { id: 4, date: "2026-10-29", items: { shirt: 3, trousers: 1, bedding: 1 } },
  { id: 5, date: "2026-10-16", items: { jacket: 2, shirt: 2 } },
  { id: 6, date: "2026-09-27", items: { trousers: 3, dress: 2, shirt: 2 } },
  { id: 7, date: "2026-08-20", items: { shirt: 4, bedding: 1, jacket: 1 } },
  { id: 8, date: "2026-07-18", items: { trousers: 2, dress: 1, shirt: 3 } },
  { id: 9, date: "2026-06-09", items: { shirt: 5, jacket: 1, trousers: 2 } },
  { id: 10, date: "2026-05-22", items: { dress: 2, bedding: 1, shirt: 2 } },
];

const periodOptions = [
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
];

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

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  const monthNames = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${Number(day)} ${monthNames[Number(month) - 1]}`;
}

function formatFullDate(date: string) {
  const [year, month, day] = date.split("-");
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${Number(day)} de ${monthNames[Number(month) - 1]} de ${year}`;
}

export default function Home() {
  const [dropoffs, setDropoffs] = useState(initialDropoffs);
  const [showForm, setShowForm] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [selectedDropoff, setSelectedDropoff] = useState<Dropoff | null>(null);
  const [draft, setDraft] = useState<Partial<Record<GarmentId, number>>>({});
  const [period, setPeriod] = useState("6");
  const [activeNav, setActiveNav] = useState("Visão geral");
  const [notice, setNotice] = useState("");

  const monthDropoffs = dropoffs.filter((dropoff) => dropoff.date.startsWith(currentMonth));
  const monthSlots = monthDropoffs.reduce((total, dropoff) => total + garments.reduce((sum, garment) => sum + (dropoff.items[garment.id] ?? 0) * garment.slots, 0), 0);
  const monthPieces = monthDropoffs.reduce((total, dropoff) => total + Object.values(dropoff.items).reduce((sum, count) => sum + (count ?? 0), 0), 0);

  const categoryStats = useMemo(() => {
    const months = Number(period);
    const cutoff = new Date(2026, 10 - months + 1, 1);
    const relevant = dropoffs.filter((dropoff) => new Date(`${dropoff.date}T12:00:00`) >= cutoff);
    return garments.map((garment) => ({
      ...garment,
      count: relevant.reduce((sum, dropoff) => sum + (dropoff.items[garment.id] ?? 0), 0),
    })).sort((a, b) => b.count - a.count);
  }, [dropoffs, period]);

  const maxCount = Math.max(...categoryStats.map((item) => item.count), 1);

  function addGarment(id: GarmentId, amount: number) {
    setDraft((current) => {
      const next = Math.max(0, (current[id] ?? 0) + amount);
      return { ...current, [id]: next || undefined };
    });
  }

  function saveDropoff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = Object.fromEntries(Object.entries(draft).filter(([, count]) => count && count > 0)) as Partial<Record<GarmentId, number>>;
    if (!Object.keys(items).length) return;
    const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const datePart = (type: string) => dateParts.find((part) => part.type === type)?.value ?? "";
    const today = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
    setDropoffs((current) => [{ id: Date.now(), date: today, items }, ...current]);
    setDraft({});
    setShowForm(false);
    setNotice("Utilização registada com sucesso");
    window.setTimeout(() => setNotice(""), 3200);
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
          <button className="profile-button"><span className="avatar">MS</span><span className="profile-copy"><b>Mariana Silva</b><small>Plano Essencial</small></span><Icon name="chevron" size={17} /></button>
        </div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar">
          <div className="breadcrumbs">A minha conta <span>/</span> <b>{activeNav}</b></div>
          <div className="topbar-right"><span className="topbar-message"><span className="status-dot" />Tudo em dia</span><button className="mobile-avatar" aria-label="Perfil Mariana Silva">MS</button></div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div><p className="eyebrow"><Icon name="sun" size={15} /> O SEU MÊS DE NOVEMBRO</p><h1>Bom dia, Mariana<span className="wave">✳</span></h1><p className="welcome-subtitle">A sua roupa está em boas mãos. Veja como vai o seu mês.</p></div>
            <button className="primary-button" onClick={() => setShowForm(true)}><Icon name="plus" size={18} />Registar utilização</button>
          </section>

          <section className="overview-grid" aria-label="Resumo do pacote">
            <article className="usage-card" id="package">
              <div className="usage-card-top"><div><span className="card-eyebrow light">O MEU PACOTE <span className="current-pill">ATIVO</span></span><h2>Essencial</h2><p>O seu ritmo, ao seu cuidado.</p></div><div className="package-icon"><Icon name="package" size={24} /></div></div>
              <div className="usage-divider" />
              <div className="usage-numbers"><div><strong>{monthSlots}<span> / 30</span></strong><small>créditos utilizados</small></div><div className="remaining"><strong>{Math.max(0, 30 - monthSlots)}</strong><small>créditos disponíveis</small></div></div>
              <div className="progress-track"><span style={{ width: `${Math.min(100, (monthSlots / 30) * 100)}%` }} /></div>
              <div className="usage-foot"><span><Icon name="calendar" size={14} /> 1–30 novembro 2026</span><span>{Math.round((monthSlots / 30) * 100)}% utilizado</span></div>
            </article>

            <article className="stat-card"><div className="stat-card-head"><span className="stat-icon lilac"><Icon name="shirt" size={19} /></span><span className="stat-trend">ESTE MÊS</span></div><strong className="stat-value">{monthPieces}<small> peças</small></strong><p>em {monthDropoffs.length} entregas</p><div className="mini-bars" aria-hidden="true"><i style={{ height: "36%" }} /><i style={{ height: "52%" }} /><i style={{ height: "43%" }} /><i style={{ height: "69%" }} /><i style={{ height: "56%" }} /><i style={{ height: "86%" }} /><i className="bar-active" style={{ height: "72%" }} /></div><div className="stat-caption">Peças cuidadas este mês</div></article>

            <article className="stat-card next-card"><div className="stat-card-head"><span className="stat-icon peach"><Icon name="clock" size={19} /></span><span className="stat-trend">A PRÓXIMA</span></div><strong className="next-date">A sua próxima<br />entrega começa aqui.</strong><p>Registe quando deixar a roupa.</p><button className="text-button" onClick={() => setShowForm(true)}>Adicionar entrega <Icon name="arrow" size={15} /></button></article>
          </section>

          <section className="content-grid">
            <article className="panel activity-panel">
              <div className="panel-heading"><div><h2>Utilização recente</h2><p>Um olhar sobre as suas últimas entregas.</p></div><button className="quiet-button" onClick={() => setShowAllActivity((value) => !value)}>{showAllActivity ? "Ver menos" : "Ver tudo"} <Icon name="arrow" size={14} /></button></div>
              <div className="activity-list" id="activity-list">
                {dropoffs.slice(0, showAllActivity ? dropoffs.length : 4).map((dropoff) => {
                  const itemCount = Object.values(dropoff.items).reduce((sum, count) => sum + (count ?? 0), 0);
                  const slotCount = garments.reduce((sum, garment) => sum + (dropoff.items[garment.id] ?? 0) * garment.slots, 0);
                  const description = garments.filter((garment) => dropoff.items[garment.id]).map((garment) => `${dropoff.items[garment.id]} ${garment.name.toLocaleLowerCase("pt-PT")}`).join(", ");
                  return <button type="button" className="activity-item" key={dropoff.id} aria-label={`Ver entrega de ${formatDate(dropoff.date)}: ${description}`} onClick={() => setSelectedDropoff(dropoff)}><span className="activity-icon"><Icon name="package" size={17} /></span><span className="activity-copy"><strong>Entrega de roupa</strong><span>{description}</span></span><span className="activity-meta"><strong>{itemCount} peças <span>·</span> {slotCount} créditos</strong><small>{formatDate(dropoff.date)}</small></span><span className="activity-open" aria-hidden="true"><Icon name="arrow" size={14} /></span></button>;
                })}
              </div>
              <button className="mobile-see-all" onClick={() => setShowAllActivity((value) => !value)}>{showAllActivity ? "Ver menos" : "Ver toda a atividade"} <Icon name="arrow" size={14} /></button>
            </article>

            <article className="panel category-panel" id="statistics">
              <div className="panel-heading category-heading"><div><h2>O que mais cuidamos</h2><p>Peças por categoria</p></div><label className="select-wrap"><span className="sr-only">Período das estatísticas</span><select value={period} onChange={(event) => setPeriod(event.target.value)}>{periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevron" size={14} /></label></div>
              <div className="category-chart">{categoryStats.map((item) => <div className="category-row" key={item.id}><span className={`category-symbol symbol-${item.id}`}><Icon name={item.icon} size={16} /></span><span className="category-name">{item.name}</span><span className="category-bar"><i style={{ width: `${(item.count / maxCount) * 100}%` }} /></span><strong className="category-count">{item.count}</strong></div>)}</div>
              <div className="category-note"><span className="note-sparkle"><Icon name="sparkle" size={15} /></span><p><strong>O seu cuidado tem um padrão.</strong> Camisas são a peça mais cuidada neste período.</p></div>
            </article>
          </section>

          <footer className="page-footer"><span>Feito com cuidado, em Lisboa <span className="footer-heart">♥</span></span><span>© 2026 Fio a Fio</span></footer>
        </div>
      </section>

      {notice && <div className="toast" role="status"><span><Icon name="check" size={17} /></span>{notice}</div>}

      {selectedDropoff && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDropoff(null); }}><section className="usage-modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="delivery-title"><div className="modal-heading"><div><span className="eyebrow"><Icon name="calendar" size={14} /> ENTREGA · {formatFullDate(selectedDropoff.date).toLocaleUpperCase("pt-PT")}</span><h2 id="delivery-title">Detalhe da entrega</h2><p>Peças incluídas nesta utilização.</p></div><button className="close-button" onClick={() => setSelectedDropoff(null)} aria-label="Fechar detalhe da entrega"><Icon name="close" size={19} /></button></div><div className="delivery-detail-items">{garments.filter((garment) => (selectedDropoff.items[garment.id] ?? 0) > 0).map((garment) => <div className="delivery-detail-item" key={garment.id}><span className={`garment-option-icon symbol-${garment.id}`}><Icon name={garment.icon} size={18} /></span><span className="garment-option-name"><strong>{garment.name}</strong><small>{garment.slots} {garment.slots === 1 ? "crédito" : "créditos"} por peça</small></span><strong className="delivery-detail-count">{selectedDropoff.items[garment.id]} <small>× {garment.slots}</small></strong><strong className="delivery-detail-subtotal">{(selectedDropoff.items[garment.id] ?? 0) * garment.slots}</strong></div>)}</div><div className="delivery-detail-total"><span>{Object.values(selectedDropoff.items).reduce((sum, count) => sum + (count ?? 0), 0)} peças entregues</span><strong>{garments.reduce((sum, garment) => sum + (selectedDropoff.items[garment.id] ?? 0) * garment.slots, 0)} créditos</strong></div></section></div>}

      {showForm && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><section className="usage-modal" role="dialog" aria-modal="true" aria-labelledby="usage-title"><div className="modal-heading"><div><span className="eyebrow">A SUA CONTA, AO SEU RITMO</span><h2 id="usage-title">Registar utilização</h2><p>Que peças deixou para cuidar hoje?</p></div><button className="close-button" onClick={() => setShowForm(false)} aria-label="Fechar"><Icon name="close" size={19} /></button></div><form onSubmit={saveDropoff}><div className="garment-options">{garments.map((garment) => <div className="garment-option" key={garment.id}><span className={`garment-option-icon symbol-${garment.id}`}><Icon name={garment.icon} size={18} /></span><span className="garment-option-name"><strong>{garment.name}</strong><small>{garment.slots} {garment.slots === 1 ? "crédito" : "créditos"} por peça</small></span><div className="quantity-control"><button type="button" onClick={() => addGarment(garment.id, -1)} aria-label={`Remover ${garment.singular}`}>−</button><span>{draft[garment.id] ?? 0}</span><button type="button" onClick={() => addGarment(garment.id, 1)} aria-label={`Adicionar ${garment.singular}`}>+</button></div></div>)}</div><div className="modal-summary"><span>Créditos desta entrega</span><strong>{garments.reduce((sum, garment) => sum + (draft[garment.id] ?? 0) * garment.slots, 0)}</strong></div><button className="primary-button modal-submit" type="submit" disabled={!Object.values(draft).some((count) => count && count > 0)}>Guardar utilização <Icon name="arrow" size={16} /></button><p className="modal-footnote"><Icon name="sparkle" size={14} /> A sua utilização atualiza-se assim que guardar.</p></form></section></div>}
    </main>
  );
}
