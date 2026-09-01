import { useMemo, useState, type ReactNode } from "react";

type IconName =
  | "overview" | "analytics" | "redeem" | "transactions" | "spots" | "product" | "event" | "catalog" | "categories" | "members"
  | "appearance" | "permission" | "support" | "report" | "feedback" | "collapse" | "document" | "settings" | "download" | "refresh"
  | "chart" | "table" | "card" | "search" | "calendar" | "chevron" | "sort" | "more" | "basic" | "verified" | "platinum" | "menu" | "close";

function Icon({ name, size = 18, stroke = 1.7 }: { name: IconName; size?: number; stroke?: number }) {
  let content: ReactNode;
  switch (name) {
    case "overview": content = <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>; break;
    case "analytics": content = <><path d="M4 19V9h4v10M10 19V4h4v15M16 19v-7h4v7" /><path d="M2 21h20" /></>; break;
    case "redeem": content = <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h3M8 15h8" /><circle cx="16" cy="11" r="1.5" /></>; break;
    case "transactions": content = <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h3" /></>; break;
    case "spots": content = <><path d="M12 3 14.4 8l5.6.7-4.1 3.9 1.1 5.5L12 15.5 7 18.1l1.1-5.5L4 8.7 9.6 8 12 3Z" /><circle cx="12" cy="10" r="1.1" /></>; break;
    case "product": content = <><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></>; break;
    case "event": content = <><path d="M3 7h18v13H3zM7 4v6M17 4v6M3 11h18" /></>; break;
    case "catalog": content = <><path d="M4 5h16v14H4zM4 9h16M8 5v14" /><path d="M12 13h5M12 16h3" /></>; break;
    case "categories": content = <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>; break;
    case "members": content = <><circle cx="9" cy="8" r="3" /><path d="M3 20c.6-3.2 2.7-5 6-5s5.4 1.8 6 5M17 12a2.6 2.6 0 0 0 0-5M17 15c2.3.2 3.6 1.6 4 4" /></>; break;
    case "appearance": content = <><path d="m14 4 6 6M4 20l3.6-.8L19 7.8a2.1 2.1 0 0 0-3-3L4.6 16.2 4 20Z" /><path d="m13 5 6 6" /></>; break;
    case "permission": content = <><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5" /><path d="m16 18 2 2 3-4" /></>; break;
    case "support": content = <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.2.9-2 1.3-2 2.7M12 17h.01" /></>; break;
    case "report": content = <><path d="M5 21V4M5 5h13l-2.4 3L18 11H5" /></>; break;
    case "feedback": content = <><path d="M4 5h16v11H8l-4 4V5Z" /><path d="M8 9h8M8 12h5" /></>; break;
    case "collapse": content = <><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M8 4v16M12 10h5M14 8l-2 2 2 2" /></>; break;
    case "document": content = <><path d="M6 3h8l4 4v14H6zM14 3v5h5M10 13h5M10 17h5" /><path d="M10 9h1" /></>; break;
    case "settings": content = <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1-1.8 3.1-.2-.1a2.1 2.1 0 0 0-2.6.4l-.1.2h-3.6l-.1-.2a2.1 2.1 0 0 0-2.6-.4l-.2.1-1.8-3.1.1-.1a2.1 2.1 0 0 0 0-3l-.1-.1 1.8-3.1.2.1a2.1 2.1 0 0 0 2.6-.4l.1-.2h3.6l.1.2a2.1 2.1 0 0 0 2.6.4l.2-.1 1.8 3.1-.1.1a2.1 2.1 0 0 0 0 3Z" /></>; break;
    case "download": content = <><path d="M12 3v11M8 10l4 4 4-4M5 18v3h14v-3" /></>; break;
    case "refresh": content = <><path d="M20 11a8 8 0 0 0-14.8-3.9L3 10M3 5v5h5M4 13a8 8 0 0 0 14.8 3.9L21 14m0 5v-5h-5" /></>; break;
    case "chart": content = <><path d="M4 17c2-7 5-8 7-3s4 4 9-5" /><circle cx="4" cy="17" r="1.2" /><circle cx="20" cy="9" r="1.2" /></>; break;
    case "table": content = <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 9h18M3 14h18M9 9v11M15 9v11" /></>; break;
    case "card": content = <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 9h18M7 14h4" /></>; break;
    case "search": content = <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>; break;
    case "calendar": content = <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M7 2.8v4M17 2.8v4M3 9h18" /></>; break;
    case "chevron": content = <path d="m8 10 4 4 4-4" />; break;
    case "sort": content = <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />; break;
    case "more": content = <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>; break;
    case "basic": content = <><path d="M4 18c.3-4.8 2.9-7.2 8-7.2s7.7 2.4 8 7.2" /><circle cx="12" cy="7" r="3" /></>; break;
    case "verified": content = <><path d="m12 3 2 1.3 2.4-.1 1.1 2.2 2 1.3-.6 2.3.6 2.3-2 1.3-1.1 2.2-2.4-.1-2 1.3-2-1.3-2.4.1-1.1-2.2-2-1.3.6-2.3L4 7.7l2-1.3 1.1-2.2 2.4.1L12 3Z" /><path d="m9 10.5 2 2 4-4" /></>; break;
    case "platinum": content = <><path d="m12 3 2.2 5.1 5.5.5-4.2 3.6 1.3 5.4-4.8-2.9-4.8 2.9 1.3-5.4-4.2-3.6 5.5-.5L12 3Z" /><path d="M7 21h10" /></>; break;
    case "menu": content = <><path d="M4 7h16M4 12h16M4 17h16" /></>; break;
    case "close": content = <><path d="m6 6 12 12M18 6 6 18" /></>; break;
  }
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{content}</svg>;
}

type RedeemRow = {
  ref: string; date: string; name: string; email: string; amount: string; amountValue: number;
  tier: "Basic" | "Verified" | "Platinum"; item: string; status: "Success" | "Pending"; code: string;
};

const rows: RedeemRow[] = [
  { ref: "PU12345678901HK", date: "02/01/2025, 18:15:23", name: "Jenifer Brown", email: "Jenifer.brown@gmail.com", amount: "$9.975,92", amountValue: 9975.92, tier: "Basic", item: "Voucher", status: "Success", code: "QWE5678IC" },
  { ref: "PU15991214827HK", date: "02/05/2025, 10:45:22", name: "Chris Traeger", email: "chirs.trae@gmail.com", amount: "$9.434,21", amountValue: 9434.21, tier: "Basic", item: "Voucher", status: "Success", code: "JKL3456IC" },
  { ref: "PU61932813584HK", date: "05/03/2025, 11:20:43", name: "Bobby Newport", email: "bobby.newport@gmail.com", amount: "$9.124,62", amountValue: 9124.62, tier: "Verified", item: "Goods", status: "Pending", code: "ASD4321IC" },
  { ref: "PU69244963749HK", date: "09/02/2025, 14:10:12", name: "Carl Lortner", email: "carl.lorthner@gmail.com", amount: "$9.084,31", amountValue: 9084.31, tier: "Basic", item: "Goods", status: "Pending", code: "FGH8765IC" },
  { ref: "PU49637853962HK", date: "04/02/2025, 15:01:19", name: "Jean Ralphio Saperstein", email: "jean.rs@gmail.com", amount: "$8.921,92", amountValue: 8921.92, tier: "Basic", item: "Goods", status: "Success", code: "ZXCV0987IC" },
  { ref: "PU74747371831HK", date: "04/02/2025, 16:05:54", name: "Duke Silver", email: "duke.silver@gmail.com", amount: "$8.901,12", amountValue: 8901.12, tier: "Basic", item: "Voucher", status: "Success", code: "BNM6543IC" },
  { ref: "PU15222856587HK", date: "21/01/2025, 21:22:01", name: "Tom Haverford", email: "tom.haverford@gmail.com", amount: "$8.512,89", amountValue: 8512.89, tier: "Platinum", item: "Voucher", status: "Pending", code: "POI3210IC" },
  { ref: "PU84866924982HK", date: "16/01/2025, 18:01:34", name: "Ron Dunn", email: "ron.dunn@gmail.com", amount: "$8.509,21", amountValue: 8509.21, tier: "Basic", item: "Cashback", status: "Success", code: "HJK5678IC" },
  { ref: "PU98989898989HK", date: "15/01/2025, 17:21:11", name: "Andy Dwyer", email: "andy.dwyer@gmail.com", amount: "$8.793,23", amountValue: 8793.23, tier: "Basic", item: "Goods", status: "Success", code: "QAZ1234IC" },
  { ref: "PU01245312351HK", date: "14/01/2025, 15:19:02", name: "Ben Wyatt", email: "ben.wyatt@gmail.com", amount: "$8.533,98", amountValue: 8533.98, tier: "Basic", item: "Cashback", status: "Pending", code: "WSX4321IC" },
  { ref: "PU29143493685HK", date: "13/01/2025, 13:00:23", name: "Craig Middlebrooks", email: "craig.middle@gmail.com", amount: "$8.429,42", amountValue: 8429.42, tier: "Verified", item: "Goods", status: "Success", code: "YUI7890IC" },
  { ref: "PU44332224421HK", date: "11/01/2025, 12:11:01", name: "Ron Swanson", email: "ron.swanson@gmail.com", amount: "$8.243,95", amountValue: 8243.95, tier: "Basic", item: "Cash", status: "Success", code: "RTY1234IC" },
  { ref: "PU36376589144HK", date: "09/01/2025, 11:23:59", name: "Garry Gerchig", email: "garry.gerchig@gmail.com", amount: "$8.023,93", amountValue: 8023.93, tier: "Platinum", item: "Membership", status: "Success", code: "EDC8765IC" },
];

const generalNav: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "overview" }, { label: "Analytics", icon: "analytics" }, { label: "User redeem", icon: "redeem" }, { label: "Transactions", icon: "transactions" }, { label: "Red spot", icon: "spots" },
];
const productNav: { label: string; icon: IconName }[] = [
  { label: "Product", icon: "product" }, { label: "Event", icon: "event" }, { label: "Catalog", icon: "catalog" }, { label: "Categories", icon: "categories" }, { label: "Members", icon: "members" },
];
const systemNav: { label: string; icon: IconName }[] = [{ label: "Appearance", icon: "appearance" }, { label: "Permission", icon: "permission" }];

function SidebarItem({ item, active, onSelect }: { item: { label: string; icon: IconName }; active: boolean; onSelect: () => void }) {
  return <button className={`sidebar-item${active ? " active" : ""}`} onClick={onSelect}><Icon name={item.icon} size={18} /><span>{item.label}</span></button>;
}
function Tier({ tier }: { tier: RedeemRow["tier"] }) {
  return <span className={`tier tier-${tier.toLowerCase()}`}><Icon name={tier === "Basic" ? "basic" : tier === "Verified" ? "verified" : "platinum"} size={15} />{tier}</span>;
}
function Status({ status }: { status: RedeemRow["status"] }) { return <span className={`status status-${status.toLowerCase()}`}>{status}</span>; }
function FilterField({ label, children }: { label: string; children: ReactNode }) { return <label className="filter-field"><span>{label}</span>{children}</label>; }

export default function App() {
  const [activeNav, setActiveNav] = useState("User redeem");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: "date" | "name" | "amount"; direction: "asc" | "desc" }>({ key: "date", direction: "asc" });
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("13");
  const defaultFilters = { amount: "0 - 10K", product: "All type", event: "All event", method: "All method", status: "All status", more: "..." };
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = rows.filter((row) => {
      const matchesSearch = !term || `${row.ref} ${row.name} ${row.email}`.toLowerCase().includes(term);
      const matchesProduct = filters.product === "All type" || row.item === filters.product;
      const matchesStatus = filters.status === "All status" || row.status === filters.status;
      return matchesSearch && matchesProduct && matchesStatus;
    });
    return [...result].sort((a, b) => {
      const first = sort.key === "amount" ? a.amountValue : sort.key === "name" ? a.name : a.date;
      const second = sort.key === "amount" ? b.amountValue : sort.key === "name" ? b.name : b.date;
      const comparison = first < second ? -1 : first > second ? 1 : 0;
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filters, search, sort]);
  const sortBy = (key: "date" | "name" | "amount") => setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  const updateFilter = (key: keyof typeof defaultFilters, value: string) => setPendingFilters((current) => ({ ...current, [key]: value }));
  const exportRows = () => {
    const csv = ["Ref number,Date,Customer,Amount,User type,Item type,Status,Item code", ...filteredRows.map((row) => [row.ref, row.date, row.name, row.amount, row.tier, row.item, row.status, row.code].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const link = document.createElement("a"); link.href = url; link.download = "user-redeem-list.csv"; link.click(); URL.revokeObjectURL(url); showToast("Redeem list exported");
  };
  const renderNavigation = (items: { label: string; icon: IconName }[]) => items.map((item) => <SidebarItem key={item.label} item={item} active={activeNav === item.label} onSelect={() => { setActiveNav(item.label); setMobileNavOpen(false); }} />);

  return <div className="app-shell">
    <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
      <div className="brand-row"><div className="brand-mark">T</div><strong>Tilesales.</strong><button className="collapse-button" aria-label="Collapse navigation"><Icon name="collapse" size={18} /></button><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><Icon name="close" size={19} /></button></div>
      <div className="workspace-switchers">
        <button className="switcher account-switcher"><span className="avatar avatar-account">JW</span><span>Personal account</span><Icon name="chevron" size={16} /></button>
        <button className="switcher app-switcher"><span className="blockade-mark">B</span><span>Blockade Bank</span><em>APP</em><Icon name="chevron" size={16} /></button>
      </div>
      <nav className="side-nav" aria-label="Main navigation"><div className="nav-section"><p className="nav-label">General</p>{renderNavigation(generalNav)}</div><div className="nav-section nav-products"><p className="nav-label">Settings</p>{renderNavigation(productNav)}</div><div className="nav-section nav-system"><p className="nav-label">System</p>{renderNavigation(systemNav)}</div></nav>
      <div className="sidebar-bottom"><SidebarItem item={{ label: "Support", icon: "support" }} active={false} onSelect={() => showToast("Support center opened")} /><SidebarItem item={{ label: "Report", icon: "report" }} active={false} onSelect={() => showToast("Report a problem")} /><SidebarItem item={{ label: "Feedback", icon: "feedback" }} active={false} onSelect={() => showToast("Thanks for your feedback")} /><div className="profile-row"><span className="avatar avatar-profile">PW</span><span className="profile-copy"><strong>Philips Woody</strong><small>Super admin</small></span><Icon name="chevron" size={16} /></div></div>
    </aside>
    <main className="main-content">
      <div className="mobile-topbar"><button aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Icon name="menu" size={21} /></button><span><span className="brand-mark small">T</span><strong>Tilesales.</strong></span></div>
      <section className="workspace">
        <header className="page-header"><div className="title-block"><h1>User redeem list <span>3.500 data</span></h1><p>View detailed records of user's redemption activity</p></div><div className="header-actions"><button className="header-icon" aria-label="Open document" onClick={() => showToast("Report generated")}><Icon name="document" size={20} /></button><button className="header-icon" aria-label="Settings" onClick={() => showToast("Table settings opened")}><Icon name="settings" size={21} /></button><span className="action-divider" /><button className="manage-button" onClick={() => showToast("Manage redeem list")}>Manage</button><button className="export-button" onClick={exportRows}><Icon name="download" size={19} />Export</button></div></header>
        <form className="filter-panel" onSubmit={(event) => { event.preventDefault(); setFilters(pendingFilters); showToast("Filters applied"); }}>
          <FilterField label="Date filter"><span className="fake-select"><span>Select date</span><Icon name="calendar" size={16} /></span></FilterField>
          <FilterField label="Transaction amount"><span className="select-wrap"><select value={pendingFilters.amount} onChange={(event) => updateFilter("amount", event.target.value)}><option>0 - 10K</option><option>10K - 50K</option><option>50K+</option></select><Icon name="chevron" size={16} /></span></FilterField>
          <FilterField label="Product type"><span className="select-wrap"><select value={pendingFilters.product} onChange={(event) => updateFilter("product", event.target.value)}><option>All type</option><option>Voucher</option><option>Goods</option><option>Cashback</option><option>Cash</option><option>Membership</option></select><Icon name="chevron" size={16} /></span></FilterField>
          <FilterField label="Event"><span className="select-wrap"><select value={pendingFilters.event} onChange={(event) => updateFilter("event", event.target.value)}><option>All event</option><option>Spring event</option><option>Member event</option></select><Icon name="chevron" size={16} /></span></FilterField>
          <FilterField label="Method"><span className="select-wrap"><select value={pendingFilters.method} onChange={(event) => updateFilter("method", event.target.value)}><option>All method</option><option>Online</option><option>In store</option></select><Icon name="chevron" size={16} /></span></FilterField>
          <FilterField label="Redeem status"><span className="select-wrap"><select value={pendingFilters.status} onChange={(event) => updateFilter("status", event.target.value)}><option>All status</option><option>Success</option><option>Pending</option></select><Icon name="chevron" size={16} /></span></FilterField>
          <FilterField label="More"><span className="select-wrap"><select value={pendingFilters.more} onChange={(event) => updateFilter("more", event.target.value)}><option>...</option><option>High value</option><option>Recent</option></select><Icon name="chevron" size={16} /></span></FilterField>
          <button className="apply-button" type="submit">Apply</button><button className="reset-button" type="button" onClick={() => { setPendingFilters(defaultFilters); setFilters(defaultFilters); showToast("Filters reset"); }}>Reset</button>
        </form>
        <section className="table-shell" aria-label="User redemption records">
          <div className="table-toolbar"><div className="view-controls"><button className="toolbar-icon" aria-label="Refresh records" onClick={() => showToast("Records refreshed")}><Icon name="refresh" size={17} /></button><div className="view-tabs"><button onClick={() => setView("table")}><Icon name="chart" size={16} />Chart</button><button className={view === "table" ? "selected" : ""} onClick={() => setView("table")}><Icon name="table" size={16} />Table</button><button className={view === "card" ? "selected" : ""} onClick={() => setView("card")}><Icon name="card" size={16} />Card</button></div></div><label className="search-box"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by reff / name" /><kbd>⌘ + F</kbd></label></div>
          {view === "table" ? <div className="records-table" role="table"><div className="table-head table-grid" role="row"><span>Reff number</span><button onClick={() => sortBy("date")}>Date <Icon name="sort" size={16} /></button><button onClick={() => sortBy("name")}>Customers <Icon name="sort" size={16} /></button><button onClick={() => sortBy("amount")}>Amount <Icon name="sort" size={16} /></button><span>User type</span><span>Item type</span><span>Redeem status</span><span>Item code</span><span /></div><div className="table-body">{filteredRows.slice(0, Number(rowsPerPage)).map((row, index) => <div className="table-row table-grid" role="row" key={row.ref} style={{ "--row-index": index } as React.CSSProperties}><span className="ref-cell">{row.ref}</span><span>{row.date}</span><span className="customer-cell"><strong>{row.name}</strong><small>{row.email}</small></span><span>{row.amount}</span><span><Tier tier={row.tier} /></span><span>{row.item}</span><span><Status status={row.status} /></span><a href={`#${row.code}`}>{row.code}</a><span className="row-menu-wrap"><button className="row-more" aria-label={`Actions for ${row.name}`} onClick={() => setOpenRow(openRow === row.ref ? null : row.ref)}><Icon name="more" size={18} /></button>{openRow === row.ref && <span className="row-menu"><button onClick={() => showToast(`Viewing ${row.ref}`)}>View</button><button onClick={() => showToast(`Editing ${row.ref}`)}>Edit</button></span>}</span></div>)}{filteredRows.length === 0 && <div className="empty-state">No records match the current filters.</div>}</div></div> : <div className="card-view">{filteredRows.map((row) => <article className="record-card" key={row.ref}><div><small>{row.ref}</small><h3>{row.name}</h3><p>{row.email}</p></div><div className="card-right"><strong>{row.amount}</strong><Tier tier={row.tier} /><Status status={row.status} /></div></article>)}</div>}
          <footer className="table-footer"><span>Page 1 of 10</span><div className="pagination"><span>Show row</span><select value={rowsPerPage} onChange={(event) => setRowsPerPage(event.target.value)}><option value="10">10</option><option value="13">13</option><option value="20">20</option></select><button disabled aria-label="Previous page">‹</button><button aria-label="Next page">›</button></div></footer>
        </section>
      </section>
    </main>
    {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}{toast && <div className="toast">{toast}</div>}
  </div>;
}