import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type IconName =
  | "overview"
  | "outbound"
  | "request"
  | "midmile"
  | "truck"
  | "help"
  | "settings"
  | "privacy"
  | "search"
  | "tune"
  | "bell"
  | "mail"
  | "plus"
  | "arrow"
  | "calendar"
  | "chevron"
  | "edit"
  | "trash"
  | "more"
  | "filter"
  | "close"
  | "menu"
  | "cart"
  | "package"
  | "pie"
  | "check"
  | "alert";

const productImages: Record<string,string> = {
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=120&q=80",
  shirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=120&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=80",
  sunglasses: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=120&q=80",
  bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=120&q=80",
  helmet: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=120&q=80",
  waterpot: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=120&q=80",
};

function Icon({ name, size = 18, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true } as const;
  switch (name) {
    case "overview": return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "outbound": return <svg {...common}><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" /><path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" /></svg>;
    case "request": return <svg {...common}><path d="M5 3h10l4 4v14H5z" /><path d="M15 3v5h4M8 12h8M8 16h6" /></svg>;
    case "midmile": return <svg {...common}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="M4 18H3V6h10v12M13 10h4l4 4v4h-1M7 10h7" /></svg>;
    case "truck": return <svg {...common}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></svg>;
    case "help": return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.35 2.35 0 1 1 3.7 1.9c-1 .7-1.5 1.1-1.5 2.4M12 16.6h.01" /></svg>;
    case "settings": return <svg {...common}><path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.2a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></svg>;
    case "privacy": return <svg {...common}><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3M12 14v2" /></svg>;
    case "search": return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>;
    case "tune": return <svg {...common}><path d="M4 6h5M13 6h7M4 12h9M17 12h3M4 18h2M10 18h10" /><circle cx="11" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></svg>;
    case "bell": return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "mail": return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "arrow": return <svg {...common}><path d="M7 17 17 7M8 7h9v9" /></svg>;
    case "calendar": return <svg {...common}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" /></svg>;
    case "chevron": return <svg {...common}><path d="m7 9 5 5 5-5" /></svg>;
    case "edit": return <svg {...common}><path d="m4 16.5-.7 3.7 3.7-.7L18.3 8.2a2.1 2.1 0 0 0-3-3L4 16.5Z" /><path d="m13.8 6.2 4 4" /></svg>;
    case "trash": return <svg {...common}><path d="M5 7h14M10 11v5M14 11v5M9 7V4h6v3M7 7l1 13h8l1-13" /></svg>;
    case "more": return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "filter": return <svg {...common}><path d="M4 5h16l-6.3 7v5l-3.4 2v-7z" /></svg>;
    case "close": return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "menu": return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "cart": return <svg {...common}><path d="M4 5h2l1.5 9h9l2-7H7M9 18.5h.01M16 18.5h.01" /></svg>;
    case "package": return <svg {...common}><path d="m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" /></svg>;
    case "pie": return <svg {...common}><path d="M12 3v9h9A9 9 0 0 0 12 3ZM12 12V3a9 9 0 1 0 9 9z" /></svg>;
    case "check": return <svg {...common}><path d="M5 13l4 4L19 7" /></svg>;
    case "alert": return <svg {...common}><path d="M12 9v6M12 17h.01" /><path d="M3.7 18L12 4l8.3 14H3.7z" /></svg>;
    default: return null;
  }
}

type InventoryItem = { id:string; name:string; sku:string; qty:number; stock:number; price:string; priceNum:number; imageKey:string; tag:string };
type DockingItem = { id:string; lhId:string; name:string; detail:string; request:number; status:"Assigned"|"Pending"; tone:"green"|"yellow"|"red"; imageKey:string };
type Toast = { id:string; text:string; tone:"success"|"info"|"error" };
type Notification = { id:string; title:string; time:string; read:boolean };

const initialInventory: InventoryItem[] = [
  { id:"1", name:"Headphone", sku:"SKU-300", qty:200, stock:150, price:"$4K", priceNum:4000, imageKey:"headphones", tag:"Fast Moving" },
  { id:"2", name:"Helmet", sku:"SKU-301", qty:500, stock:350, price:"$7K", priceNum:7000, imageKey:"helmet", tag:"Fast Moving" },
  { id:"3", name:"T Shirts", sku:"SKU-302", qty:2000, stock:560, price:"$3K", priceNum:3000, imageKey:"shirt", tag:"Discounted" },
  { id:"4", name:"Sunglass", sku:"SKU-303", qty:3000, stock:1000, price:"$5K", priceNum:5000, imageKey:"sunglasses", tag:"Low Demand" },
  { id:"5", name:"Water Pot", sku:"SKU-304", qty:1200, stock:700, price:"$2K", priceNum:2000, imageKey:"bottle", tag:"New Arrival" },
  { id:"6", name:"Backpack", sku:"SKU-305", qty:800, stock:420, price:"$6K", priceNum:6000, imageKey:"backpack", tag:"Dead Items" },
];

const initialDocking: DockingItem[] = [
  { id:"d1", lhId:"LR-2045", name:"Backpack", detail:"25 In Stock", request:120, status:"Assigned", tone:"green", imageKey:"backpack" },
  { id:"d2", lhId:"LR-2046", name:"Helmet", detail:"Out of stock", request:90, status:"Pending", tone:"yellow", imageKey:"helmet" },
  { id:"d3", lhId:"LR-2047", name:"Headphone", detail:"100 In Stock", request:75, status:"Assigned", tone:"green", imageKey:"headphones" },
  { id:"d4", lhId:"LR-2048", name:"Bottle", detail:"Low stock-02", request:40, status:"Pending", tone:"red", imageKey:"bottle" },
  { id:"d5", lhId:"LR-2049", name:"Sunglass", detail:"12 In Stock", request:65, status:"Assigned", tone:"green", imageKey:"sunglasses" },
];

const chartDatasets: Record<string, Record<string,{ request:number[]; consume:number[] }>> = {
  Monthly: {
    Fashion: { request:[22,45,28,38,18,32,26,34,30,14,22,19], consume:[30,42,35,46,22,28,24,30,26,10,18,16] },
    Electronic: { request:[18,32,24,28,16,22,20,26,24,12,18,15], consume:[24,36,28,34,20,24,18,22,20,9,14,12] },
    Drinks:{ request:[12,22,18,20,14,18,15,20,18,10,14,12], consume:[16,26,20,24,16,20,16,18,14,8,11,10] },
    Toys:{ request:[28,38,32,42,24,36,30,40,34,18,26,22], consume:[32,44,36,48,28,32,26,34,28,14,20,18] },
    Watch:{ request:[15,26,20,24,14,20,18,22,20,11,16,13], consume:[18,30,24,28,18,22,20,24,22,12,17,14] },
  },
  Weekly: {
    Fashion:{ request:[32,28,45,38,42,30,35], consume:[28,24,38,32,36,26,30] },
    Electronic:{ request:[22,18,30,26,28,20,24], consume:[18,15,26,22,24,18,20] },
    Drinks:{ request:[14,12,18,16,20,14,16], consume:[12,10,16,14,18,12,14] },
    Toys:{ request:[38,32,48,42,46,36,40], consume:[34,28,44,38,42,32,36] },
    Watch:{ request:[18,15,24,20,22,16,18], consume:[15,12,20,17,19,14,16] },
  },
  Daily: {
    Fashion:{ request:[8,12,18,22,30,45,38,42,35,28,22,14], consume:[6,10,14,18,26,38,32,36,30,24,18,12] },
    Electronic:{ request:[6,9,14,16,22,32,28,30,24,18,14,9], consume:[5,8,12,14,18,28,24,26,20,15,11,7] },
    Drinks:{ request:[4,6,10,12,16,22,18,20,16,12,9,6], consume:[3,5,8,10,14,18,15,17,13,10,7,5] },
    Toys:{ request:[10,14,22,28,36,48,42,46,38,30,24,16], consume:[8,12,18,24,30,42,36,40,32,26,20,14] },
    Watch:{ request:[5,8,12,15,20,28,24,26,20,16,11,7], consume:[4,6,10,12,16,24,20,22,17,13,9,6] },
  }
};

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current; if(!node) return;
    const o=new IntersectionObserver(([e])=>{ if(e.isIntersecting){ node.style.setProperty("--reveal-delay", `${delay}ms`); node.classList.add("is-visible"); o.disconnect(); } },{threshold:0.08});
    o.observe(node); return()=>o.disconnect();
  },[delay]);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function useToasts(){
  const [toasts, setToasts]=useState<Toast[]>([]);
  const push=(text:string, tone:Toast["tone"]="success")=>{
    const id=Math.random().toString(36).slice(2);
    setToasts(t=>[...t,{id,text,tone}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 2800);
  };
  return { toasts, push };
}

// ---------- Small pieces ----------
function Logo(){ return <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span/><span/><span/></div><span className="brand-name">vault</span></div>; }

function Sidebar({ isOpen, close, active, setActive, pushToast }: { isOpen:boolean; close:()=>void; active:string; setActive:(s:string)=>void; pushToast:(m:string, tone?:Toast["tone"])=>void }){
  const [outboundOpen,setOutboundOpen]=useState(true);
  const [midmileOpen,setMidmileOpen]=useState(true);
  return (
    <>
      <div className={`sidebar-scrim ${isOpen?"show":""}`} onClick={close} />
      <aside className={`sidebar ${isOpen?"open":""}`}>
        <div className="sidebar-top"><Logo/><button className="sidebar-collapse" onClick={()=>pushToast("Sidebar collapsed","info")} aria-label="Collapse menu"><span/><span/></button></div>
        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-section-label">MENU</div>
          <a className={`nav-link ${active==="overview"?"active":""}`} href="#overview" onClick={()=>setActive("overview")}><Icon name="overview" size={17}/><span>Overview</span></a>
          <button className={`nav-link has-children ${active.startsWith("outbound")?"active":""}`} onClick={()=>setOutboundOpen(v=>!v)} aria-expanded={outboundOpen}><Icon name="outbound" size={17}/><span>Outbound</span><Icon name="chevron" size={14}/></button>
          <div className={`nav-subnav ${outboundOpen?"expanded":""}`}><a className={`nav-sublink ${active==="lh"?"active-sub":""}`} href="#lh-request" onClick={()=>setActive("lh")}><span className="sub-dot"/>LH Request</a></div>
          <button className={`nav-link has-children ${active.startsWith("midmile")?"active":""}`} onClick={()=>setMidmileOpen(v=>!v)} aria-expanded={midmileOpen}><Icon name="midmile" size={17}/><span>Midmile</span><Icon name="chevron" size={14}/></button>
          <div className={`nav-subnav ${midmileOpen?"expanded":""}`}><a className={`nav-sublink ${active==="truck"?"active-sub":""}`} href="#truck-request" onClick={()=>setActive("truck")}><span className="sub-dot"/>Truck Request</a></div>
          <div className="sidebar-rule"/>
          <div className="nav-section-label">GENERAL</div>
          <a className="nav-link" href="#help" onClick={(e)=>{e.preventDefault(); pushToast("Help center opening soon","info")}}><Icon name="help" size={17}/><span>Help</span></a>
          <a className="nav-link" href="#settings" onClick={(e)=>{e.preventDefault(); pushToast("Settings saved","success")}}><Icon name="settings" size={17}/><span>Settings</span></a>
          <a className="nav-link" href="#privacy" onClick={(e)=>{e.preventDefault(); pushToast("Privacy controls","info")}}><Icon name="privacy" size={17}/><span>Privacy</span></a>
        </nav>
        <div className="sidebar-account"><div className="avatar avatar-admin">EA</div><div><strong>Evano</strong><span>Sales Admin</span></div><button className="acct-more" onClick={()=>pushToast("Account menu","info")}><Icon name="more" size={18}/></button></div>
      </aside>
    </>
  );
}

function Header({ onMenu, search, setSearch, onAdd, notifications, messages, pushToast, onFilterChange }: {
  onMenu:()=>void;
  search:string; setSearch:(v:string)=>void;
  onAdd:()=>void;
  notifications: Notification[]; messages: Notification[];
  pushToast:(m:string,tone?:Toast["tone"])=>void;
  onFilterChange:(key:string)=>void;
}){
  const [filterOpen,setFilterOpen]=useState(false);
  const [notifOpen,setNotifOpen]=useState(false);
  const [mailOpen,setMailOpen]=useState(false);
  const [notifs,setNotifs]=useState(notifications);
  const [msgs,setMsgs]=useState(messages);
  useEffect(()=>setNotifs(notifications),[notifications]);
  useEffect(()=>setMsgs(messages),[messages]);
  const unreadNotifs=notifs.filter(n=>!n.read).length;
  const unreadMsgs=msgs.filter(n=>!n.read).length;

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Icon name="menu" size={21}/></button>
      <h1>Inventory</h1>
      <div className="top-actions">
        <label className="search-box"><Icon name="search" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search here" aria-label="Search inventory"/><button className={`clear-search ${search?"show":""}`} type="button" onClick={()=>setSearch("")} aria-label="Clear search"><Icon name="close" size={14}/></button></label>
        <div className="filter-wrap">
          <button className={`top-icon-button ${filterOpen?"selected":""}`} onClick={()=>setFilterOpen(v=>!v)} aria-label="Filter dashboard"><Icon name="tune" size={20}/></button>
          {filterOpen && <div className="popover filter-popover"><strong>Quick filters</strong>
            <button onClick={()=>{onFilterChange("30days"); setFilterOpen(false); pushToast("Filtered: Last 30 days","success")}}>Last 30 days <span>✓</span></button>
            <button onClick={()=>{onFilterChange("all"); setFilterOpen(false); pushToast("Showing all requests","info")}}>All requests <span>✓</span></button>
            <button onClick={()=>{setSearch(""); setFilterOpen(false); pushToast("Filters cleared","info")}}>Clear search</button>
          </div>}
        </div>
        <div className="notif-wrap">
          <button className="top-icon-button notification-button" onClick={()=>{setNotifOpen(v=>!v); setMailOpen(false);}} aria-label="Notifications"><Icon name="bell" size={20}/>{unreadNotifs>0 && <i className="badge-dot"/>}<span className={`bell-count ${unreadNotifs?"show":""}`}>{unreadNotifs}</span></button>
          {notifOpen && <div className="popover notice-popover wide-popover">
            <div className="popover-head"><strong>Notifications</strong><button onClick={()=>{setNotifs(ns=>ns.map(n=>({...n, read:true}))); pushToast("All notifications read","success")}}>Mark read</button></div>
            {notifs.length===0? <span className="empty-note">No new updates</span> : <div className="notif-list">{notifs.map(n=><div key={n.id} className={`notif-row ${n.read?"read":""}`}><span className="notif-dot"/><div><b>{n.title}</b><span>{n.time}</span></div><button onClick={()=>setNotifs(a=>a.filter(x=>x.id!==n.id))}><Icon name="close" size={12}/></button></div>)}</div>}
            <button className="popover-action" onClick={()=>{setNotifs([]); setNotifOpen(false); pushToast("Notifications cleared","info")}}>Clear all</button>
          </div>}
        </div>
        <div className="notif-wrap">
          <button className="top-icon-button mail-button" onClick={()=>{setMailOpen(v=>!v); setNotifOpen(false);}} aria-label="Messages"><Icon name="mail" size={19}/>{unreadMsgs>0 && <i className="badge-dot mail-dot"/>}</button>
          {mailOpen && <div className="popover notice-popover wide-popover mail-popover">
            <div className="popover-head"><strong>Messages</strong><span>{unreadMsgs} new</span></div>
            <div className="notif-list">{msgs.map(m=><div key={m.id} className={`notif-row ${m.read?"read":""}`}><div className="avatar small-avatar">OP</div><div><b>{m.title}</b><span>{m.time}</span></div><button onClick={()=>pushToast("Opened conversation","info")}><Icon name="arrow" size={12}/></button></div>)}</div>
            <button className="popover-action" onClick={()=>{setMsgs(ms=>ms.map(x=>({...x, read:true}))); pushToast("Messages read","success")}}>Mark all read</button>
          </div>}
        </div>
        <button className="add-product" onClick={onAdd}><span>Add New Product</span><Icon name="plus" size={15} strokeWidth={2.6}/></button>
      </div>
    </header>
  );
}

function KpiCard({ icon,label,value,delta,deltaTone,note,children, dark=false, delay=0, onClick, active }:{icon:IconName; label:string; value:string; delta?:string; deltaTone?: "green"|"red"|"yellow"; note:string; children?:ReactNode; dark?:boolean; delay?:number; onClick?:()=>void; active?:boolean}){
  return (
    <Reveal delay={delay} className="kpi-reveal">
      <article className={`kpi-card ${dark?"dark":""} ${active?"kpi-active":""} ${onClick?"clickable":""}`} onClick={onClick} role={onClick?"button":undefined} tabIndex={onClick?0:undefined} onKeyDown={e=>{ if(onClick && (e.key==="Enter"|| e.key===" ")) onClick(); }}>
        <div className="kpi-topline"><span className="kpi-icon"><Icon name={icon} size={19}/></span><button className="round-action" aria-label={`Open ${label}`} onClick={e=>{e.stopPropagation(); onClick?.();}}><Icon name="arrow" size={15}/></button></div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value-row"><strong>{value}</strong>{children}</div>
        <div className="kpi-foot">{delta && <span className={`delta ${deltaTone||"green"}`}>{delta}</span>}<span>{note}</span></div>
      </article>
    </Reveal>
  );
}
function Gauge({ value, tone="lime", className="" }: {value:string; tone?:"lime"|"rose"; className?:string}){
  return <div className={`gauge ${tone} ${className}`}><div className="gauge-track"/><div className="gauge-center">{value}<span>{tone==="lime"?"Requests\nAssigned":"Decrease"}</span></div></div>;
}

function MonthlySelect({ value, onChange }: {value:string; onChange:(v:string)=>void}){
  const [open,setOpen]=useState(false);
  return <div className="select-wrap"><button className="month-select" onClick={()=>setOpen(v=>!v)}><Icon name="calendar" size={15}/> {value} <Icon name="chevron" size={13}/></button>{open && <div className="select-menu">{["Daily","Weekly","Monthly"].map(o=><button key={o} className={value===o?"sel-active":""} onClick={()=>{onChange(o); setOpen(false);}}>{o}</button>)}</div>}</div>;
}

// Chart component - fully functional interactive
function RequestChart({ period, setPeriod, activeCat, setActiveCat, pushToast }:{ period:string; setPeriod:(p:string)=>void; activeCat:string; setActiveCat:(c:string)=>void; pushToast:(m:string,tone?:Toast["tone"])=>void }){
  const data = chartDatasets[period]?.[activeCat] ?? chartDatasets[period]?.["Fashion"] ?? chartDatasets["Monthly"]["Fashion"];
  const [hoverIdx, setHoverIdx]=useState<number|null>(4);
  const wrapRef=useRef<HTMLDivElement>(null);
  const maxVal=50;
  const len=data.request.length;
  // generate path
  const buildPath=(arr:number[])=>{
    const w=660, h=260;
    const xStep=w/(arr.length-1);
    let d=`M0 ${h - (arr[0]/maxVal)*230 - 10}`;
    for(let i=1;i<arr.length;i++){
      const x1=i*xStep, y1=h - (arr[i]/maxVal)*230 -10;
      const prevX=(i-1)*xStep, prevY=h - (arr[i-1]/maxVal)*230 -10;
      const cx=(prevX+x1)/2;
      d+=` C${cx} ${prevY} ${cx} ${y1} ${x1} ${y1}`;
    }
    return d;
  };
  const requestPath=buildPath(data.request);
  const consumePath=buildPath(data.consume);
  const requestArea=requestPath+` V260 H0 Z`;
  const consumeArea=consumePath+` V260 H0 Z`;

  const handleMove=(e: React.MouseEvent)=>{
    if(!wrapRef.current) return;
    const rect=wrapRef.current.getBoundingClientRect();
    const x=e.clientX-rect.left - 41; // offset due to y labels
    const chartW=rect.width - 41 - 12;
    const idx=Math.max(0, Math.min(len-1, Math.round((x/chartW)*(len-1))));
    setHoverIdx(idx);
  };

  const xLabels= useMemo(()=>{
    if(period==="Monthly") return ["Electronic","Drinks","Watch","Fashion","Fashion","Toys"];
    if(period==="Weekly") return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return ["00:00","04:00","08:00","12:00","16:00","20:00"];
  },[period]);

  const hoverX = hoverIdx!==null ? (660/(len-1))*hoverIdx : 278;
  const hoverVal = hoverIdx!==null ? data.request[hoverIdx]*1000 : 31000; // scaled
  const yTop = hoverIdx!==null ? 255 - (data.request[hoverIdx]/maxVal)*230 -10 : 166;

  return (
    <section className="panel chart-panel" id="lh-request">
      <div className="panel-heading">
        <div><h2>Request per Hour</h2><div className="chart-legend"><span><i className="legend-dot lime-dot"/>Request volume</span><span><i className="legend-dot pale-dot"/>Consume</span></div></div>
        <MonthlySelect value={period} onChange={setPeriod}/>
      </div>
      <div className="line-chart-wrap" ref={wrapRef} onMouseMove={handleMove} onMouseLeave={()=>setHoverIdx(4)}>
        <div className="chart-y-labels"><span>$ 50K</span><span>$ 40K</span><span>$ 30K</span><span>$ 20K</span><span>$ 10K</span></div>
        <svg className="line-chart" viewBox="0 0 660 260" preserveAspectRatio="none" role="img" aria-label="Request volume versus consume line chart">
          <defs>
            <linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e6f7a2" stopOpacity=".48"/><stop offset="1" stopColor="#f8fbe8" stopOpacity=".14"/></linearGradient>
            <linearGradient id="consumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbfac7" stopOpacity=".36"/><stop offset="1" stopColor="#fffff8" stopOpacity=".05"/></linearGradient>
          </defs>
          <g className="chart-grid"><path d="M0 20H660M0 77H660M0 135H660M0 193H660M0 250H660"/></g>
          <path className="chart-area area-soft" d={consumeArea}/>
          <path className="chart-area" d={requestArea}/>
          <path className="chart-line soft-line" d={consumePath}/>
          <path className="chart-line" d={requestPath}/>
          {hoverIdx!==null && <><line x1={hoverX} x2={hoverX} y1={10} y2={255} className="chart-marker-line"/><circle cx={hoverX} cy={yTop} r={6} className="chart-marker"/><circle cx={hoverX} cy={255 - (data.consume[hoverIdx]/maxVal)*230 -10} r={4} className="chart-marker soft-marker"/></>}
        </svg>
        {hoverIdx!==null && <div className="chart-callout" style={{ left: `calc(38% + ${(hoverX-278)/660*100}% )`, transform: "translateX(-50%)" }}><span>{xLabels[Math.min(hoverIdx, xLabels.length-1)]} • Requests</span><strong>$ {(hoverVal).toLocaleString()}</strong></div>}
      </div>
      <div className="chart-x-labels">
        {xLabels.map((lbl, i)=> <button key={lbl+i} className={activeCat===lbl || (period==="Monthly" && ["Fashion"].includes(lbl) && activeCat==="Fashion" && i===3) ? "active":""} onClick={()=>{ if(period==="Monthly") setActiveCat(lbl); else pushToast(`${lbl}: ${data.request[i % data.request.length]*1000} requests`,"info"); }}>{lbl}</button>)}
        <span className="chart-pagers"><button onClick={()=>pushToast("Previous page","info")} aria-label="Previous"><span>‹</span></button><button onClick={()=>pushToast("Next page","info")} aria-label="Next"><span>›</span></button></span>
      </div>
    </section>
  );
}

function ProductThumb({ type }: { type:string }){
  const src=productImages[type] ?? productImages["bottle"];
  return <img className="product-thumb" src={src} alt="" loading="lazy"/>;
}

// ---------------- Main App ----------------
export default function App(){
  const { toasts, push } = useToasts();
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [activeSection,setActiveSection]=useState("lh");
  const [globalSearch,setGlobalSearch]=useState("");
  const [inventory,setInventory]=useState<InventoryItem[]>(initialInventory);
  const [docking,setDocking]=useState<DockingItem[]>(initialDocking);
  const [tags,setTags]=useState(["Fast Moving","Discounted","Low Demand","Dead Items","New Arrival"]);
  const [activeTag,setActiveTag]=useState("Fast Moving");
  const [chartPeriod,setChartPeriod]=useState("Monthly");
  const [chartCat,setChartCat]=useState("Fashion");
  const [truckPeriod,setTruckPeriod]=useState("All sizes");
  const [dockingSearch,setDockingSearch]=useState("");
  const [showDockingSearch,setShowDockingSearch]=useState(false);
  const [dockingStatusFilter,setDockingStatusFilter]=useState<"All"|"Assigned"|"Pending">("All");
  const [sortInv,setSortInv]=useState<{key:keyof InventoryItem; dir:1|-1}|null>(null);
  const [sortDock,setSortDock]=useState<{key:keyof DockingItem; dir:1|-1}|null>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [editingInv,setEditingInv]=useState<InventoryItem|null>(null);
  const [editingDock,setEditingDock]=useState<DockingItem|null>(null);
  const [newTagName,setNewTagName]=useState("");
  const [showAddTag,setShowAddTag]=useState(false);
  const [notifData] = useState<Notification[]>([
    {id:"n1", title:"New LH Request LR-2050 assigned", time:"2m ago", read:false},
    {id:"n2", title:"Truck docking delayed 20min", time:"1h ago", read:false},
    {id:"n3", title:"Inventory synced successfully", time:"3h ago", read:true},
  ]);
  const [msgData] = useState<Notification[]>([
    {id:"m1", title:"Ops Manager: Confirm docking slot?", time:"10m ago", read:false},
    {id:"m2", title:"Warehouse: Stock updated", time:"2h ago", read:false},
  ]);

  // derived KPIs with animation
  const totalRequests = useMemo(()=> 2255 + docking.reduce((a,b)=>a+b.request,0),[docking]);
  const pendingCount = useMemo(()=> docking.filter(d=>d.status==="Pending").length,[docking]);
  // For display: keep Pending total as large number like design but proportional to pendingCount
  const pendingDisplay = useMemo(()=> 2300 + pendingCount*20, [pendingCount]);
  const assignedCount = useMemo(()=> docking.filter(d=>d.status==="Assigned").length,[docking]);
  const forDockingDays = useMemo(()=> (2.5 + pendingCount*0.15).toFixed(1),[pendingCount]);

  // filtered inventory
  const filteredInventory = useMemo(()=>{
    let arr=[...inventory];
    if(activeTag && activeTag!=="All") arr=arr.filter(i=>i.tag===activeTag);
    if(globalSearch) {
      const q=globalSearch.toLowerCase();
      arr=arr.filter(i=> i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q));
    }
    if(sortInv){
      arr.sort((a,b)=>{
        const av=a[sortInv.key] as unknown as string|number;
        const bv=b[sortInv.key] as unknown as string|number;
        if(typeof av==="number" && typeof bv==="number") return (av-bv)*sortInv.dir;
        return String(av).localeCompare(String(bv))*sortInv.dir;
      });
    }
    return arr;
  },[inventory, activeTag, globalSearch, sortInv]);

  const filteredDocking = useMemo(()=>{
    let arr=[...docking];
    if(dockingStatusFilter!=="All") arr=arr.filter(d=>d.status===dockingStatusFilter);
    const q=(globalSearch || dockingSearch).toLowerCase();
    if(q) arr=arr.filter(d=> d.name.toLowerCase().includes(q) || d.lhId.toLowerCase().includes(q) || d.detail.toLowerCase().includes(q) || d.status.toLowerCase().includes(q));
    if(sortDock){
      arr.sort((a,b)=>{
        const av=a[sortDock.key] as unknown as string|number;
        const bv=b[sortDock.key] as unknown as string|number;
        if(typeof av==="number" && typeof bv==="number") return (av-bv)*sortDock.dir;
        return String(av).localeCompare(String(bv))*sortDock.dir;
      });
    }
    return arr;
  },[docking, dockingStatusFilter, globalSearch, dockingSearch, sortDock]);

  // close mobile sidebar on resize/nav
  useEffect(()=>{ const h=()=>{ if(window.innerWidth>820) setSidebarOpen(false); }; window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);

  const handleAddProduct=(data: Omit<InventoryItem,"id"> & {request?:number})=>{
    const newItem: InventoryItem = { ...data, id: Math.random().toString(36).slice(2,7) };
    setInventory(v=>[newItem, ...v]);
    if(data.request){
      const newDock: DockingItem = { id:Math.random().toString(36).slice(2,7), lhId:`LR-${2049+inventory.length+1}`, name:data.name, detail:`${data.stock} In Stock`, request:data.request, status:"Pending", tone:"yellow", imageKey:data.imageKey };
      setDocking(d=>[newDock, ...d]);
    }
    push(`Added ${data.name} to inventory`,"success");
    setShowAdd(false);
  };
  const handleDeleteInv=(id:string)=>{
    setInventory(v=>v.filter(x=>x.id!==id));
    push("Product removed","info");
  };
  const handleDeleteDock=(id:string)=>{
    setDocking(v=>v.filter(x=>x.id!==id));
    push("Request removed","info");
  };
  const toggleDockStatus=(id:string)=>{
    setDocking(v=>v.map(d=> d.id===id ? {...d, status: d.status==="Assigned"?"Pending":"Assigned", tone: d.status==="Assigned"?"yellow":"green" } as DockingItem : d));
    push("Status updated","success");
  };
  const handleAddTag=()=>{
    if(!newTagName.trim()) return push("Tag name required","error");
    if(tags.includes(newTagName.trim())) return push("Tag already exists","error");
    setTags(t=>[...t, newTagName.trim()]);
    setActiveTag(newTagName.trim());
    setNewTagName("");
    setShowAddTag(false);
    push(`Tag "${newTagName.trim()}" created`,"success");
  };

  const truckDatasets = {
    "All sizes": { total:568, large:45, medium:32, small:23 },
    "This week": { total:412, large:38, medium:41, small:21 },
  } as const;
  const currentTruck = truckDatasets[truckPeriod as keyof typeof truckDatasets];

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} close={()=>setSidebarOpen(false)} active={activeSection} setActive={setActiveSection} pushToast={push}/>
      <div className="main-shell">
        <Header onMenu={()=>setSidebarOpen(true)} search={globalSearch} setSearch={setGlobalSearch} onAdd={()=>setShowAdd(true)} notifications={notifData} messages={msgData} pushToast={push} onFilterChange={(k)=>{ if(k==="all") setDockingStatusFilter("All"); else { setChartPeriod("Monthly"); push(`Filter applied: ${k}`) } } }/>
        <main className="dashboard" id="overview">
          <Reveal className="page-intro"><p className="eyebrow">OUTBOUND OPERATIONS</p><h2>Welcome back, Evano</h2><p>Keep your requests moving smoothly across every dock.</p></Reveal>

          <section className="kpi-grid" aria-label="Request summary">
            <KpiCard icon="cart" label="Total Request" value={totalRequests.toLocaleString()} delta="+10%" note="Since Last Month" dark delay={40} onClick={()=>{setDockingStatusFilter("All"); setGlobalSearch(""); push("Showing all requests","info")}} active={dockingStatusFilter==="All"} />
            <KpiCard icon="package" label="Pending" value={pendingDisplay.toLocaleString()} delta="+7%" note="Since Last Month" delay={80} onClick={()=>{setDockingStatusFilter("Pending"); push("Filtered pending requests","info")}} active={dockingStatusFilter==="Pending"} />
            <KpiCard icon="request" label="Assigned" value={`${Math.round((assignedCount/docking.length)*100)}%`} delta="-10%" deltaTone="yellow" note="Since last month" delay={120} onClick={()=>{setDockingStatusFilter("Assigned"); push("Filtered assigned","info")}} active={dockingStatusFilter==="Assigned"}><Gauge value={String(assignedCount*10+ 80)} tone="lime"/></KpiCard>
            <KpiCard icon="truck" label="For Docking" value={`${forDockingDays} Days`} delta="-20%" deltaTone="red" note="Since last month" delay={160} onClick={()=>{setActiveSection("truck"); document.getElementById("truck-request")?.scrollIntoView({behavior:"smooth", block:"center"});}}><Gauge value="20%" tone="rose" className="rose-gauge"/></KpiCard>
          </section>

          <div className="middle-grid">
            <Reveal delay={100}><RequestChart period={chartPeriod} setPeriod={setChartPeriod} activeCat={chartCat} setActiveCat={setChartCat} pushToast={push}/></Reveal>
            <Reveal delay={160}>
              <section className="panel tags-panel">
                <div className="panel-heading compact-heading"><div><h2>LHTrip Created</h2><span className="heading-helper">Categories By AI Assistant</span></div><button className="more-button" aria-label="More options" onClick={()=>push("LHTrip options","info")}><Icon name="more" size={18}/></button></div>
                <div className="tag-list">
                  <button className={activeTag==="All"?"active":""} onClick={()=>setActiveTag("All")}>All</button>
                  {tags.map(item=> <button key={item} className={activeTag===item?"active":""} onClick={()=>setActiveTag(item)}>{item}</button>)}
                  <button className="add-tag" onClick={()=>setShowAddTag(true)}><Icon name="plus" size={14}/> Add Tag</button>
                </div>
                <div className="table-scroll">
                  <table className="inventory-table">
                    <thead><tr>
                      <th className="sortable" onClick={()=>setSortInv(s=> s?.key==="name" && s.dir===1 ? {key:"name", dir:-1}:{key:"name", dir:1})}>Products Details {sortInv?.key==="name" && (sortInv.dir===1?"↑":"↓")}</th>
                      <th className="sortable" onClick={()=>setSortInv(s=> s?.key==="qty" && s.dir===1 ? {key:"qty", dir:-1}:{key:"qty", dir:1})}>Total Qty {sortInv?.key==="qty" && (sortInv.dir===1?"↑":"↓")}</th>
                      <th className="sortable" onClick={()=>setSortInv(s=> s?.key==="stock" && s.dir===1 ? {key:"stock", dir:-1}:{key:"stock", dir:1})}>Stock In {sortInv?.key==="stock" && (sortInv.dir===1?"↑":"↓")}</th>
                      <th className="sortable" onClick={()=>setSortInv(s=> s?.key==="priceNum" && s.dir===1 ? {key:"priceNum", dir:-1}:{key:"priceNum", dir:1})}>Price {sortInv?.key==="priceNum" && (sortInv.dir===1?"↑":"↓")}</th>
                      <th>Action</th>
                    </tr></thead>
                    <tbody>
                      {filteredInventory.length===0 ? <tr><td colSpan={5} className="empty-cell"><Icon name="alert" size={16}/> No products found for "{globalSearch || activeTag}" <button onClick={()=>{setActiveTag("All"); setGlobalSearch("");}}>Clear filters</button></td></tr>
                       : filteredInventory.map(row=> <tr key={row.id} className="row-hover">
                        <td><div className="product-cell"><ProductThumb type={row.imageKey}/><div><strong>{row.name}</strong><span>{row.sku} • {row.tag}</span></div></div></td>
                        <td>{row.qty.toLocaleString()}</td><td>{row.stock.toLocaleString()}</td><td>{row.price}</td>
                        <td><div className="row-actions"><button onClick={()=>setEditingInv(row)} aria-label={`Edit ${row.name}`}><Icon name="edit" size={15}/></button><button onClick={()=>handleDeleteInv(row.id)} aria-label={`Delete ${row.name}`}><Icon name="trash" size={15}/></button></div></td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="table-foot"><span>{filteredInventory.length} products • {inventory.reduce((a,b)=>a+b.stock,0).toLocaleString()} units in stock</span><button onClick={()=>setShowAdd(true)} className="link-btn">+ New product</button></div>
              </section>
            </Reveal>
          </div>

          <div className="bottom-grid">
            <Reveal delay={120}>
              <section className="panel docking-panel" id="truck-request">
                <div className="panel-heading table-heading"><h2>For Docking</h2>
                  <div className="table-tools">
                    {showDockingSearch ? <div className="inline-search"><input autoFocus value={dockingSearch} onChange={e=>setDockingSearch(e.target.value)} placeholder="Search LH..."/><button onClick={()=>{setDockingSearch(""); setShowDockingSearch(false);}}><Icon name="close" size={14}/></button></div>
                     : <button className="small-icon-button" aria-label="Search requests" onClick={()=>setShowDockingSearch(true)}><Icon name="search" size={17}/></button>}
                    <button className={`small-icon-button ${dockingStatusFilter!=="All"?"filtered":""}`} aria-label="Filter requests" onClick={()=>setDockingStatusFilter(s=> s==="All"?"Pending": s==="Pending"?"Assigned":"All")}><Icon name="tune" size={17}/></button>
                    <MonthlySelect value={chartPeriod} onChange={setChartPeriod}/>
                  </div>
                </div>
                <div className="filter-chips"><span className={`chip ${dockingStatusFilter==="All"?"active":""}`} onClick={()=>setDockingStatusFilter("All")}>All</span><span className={`chip green ${dockingStatusFilter==="Assigned"?"active":""}`} onClick={()=>setDockingStatusFilter("Assigned")}>Assigned</span><span className={`chip yellow ${dockingStatusFilter==="Pending"?"active":""}`} onClick={()=>setDockingStatusFilter("Pending")}>Pending</span>{globalSearch && <span className="chip search-chip">Search: {globalSearch} <button onClick={()=>setGlobalSearch("")}><Icon name="close" size={10}/></button></span>}</div>
                <div className="table-scroll"><table className="request-table"><thead><tr>
                  <th className="sortable" onClick={()=>setSortDock(s=> s?.key==="name" && s.dir===1 ? {key:"name", dir:-1}:{key:"name", dir:1})}>Product Name {sortDock?.key==="name" && (sortDock.dir===1?"↑":"↓")}</th>
                  <th>LHTrip ID</th>
                  <th className="sortable" onClick={()=>setSortDock(s=> s?.key==="request" && s.dir===1 ? {key:"request", dir:-1}:{key:"request", dir:1})}>Request {sortDock?.key==="request" && (sortDock.dir===1?"↑":"↓")}</th>
                  <th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredDocking.length===0 ? <tr><td colSpan={5} className="empty-cell">No docking requests match filters. <button onClick={()=>{setDockingStatusFilter("All"); setDockingSearch(""); setGlobalSearch("");}}>Reset</button></td></tr>
                     : filteredDocking.map(row=> <tr key={row.id} className="row-hover">
                      <td><div className="product-cell"><ProductThumb type={row.imageKey}/><div><strong>{row.name}</strong><span className={row.tone==="red"?"low-stock":""}>{row.detail}</span></div></div></td>
                      <td><button className="lh-link" onClick={()=>push(`Copied ${row.lhId}`,"info")}>{row.lhId}</button></td>
                      <td>{row.request}</td>
                      <td><button className={`status ${row.tone}`} onClick={()=>toggleDockStatus(row.id)} title="Click to toggle status">{row.status}</button></td>
                      <td><div className="row-actions"><button onClick={()=>setEditingDock(row)} aria-label={`Edit ${row.name}`}><Icon name="edit" size={15}/></button><button onClick={()=>handleDeleteDock(row.id)} aria-label={`Delete ${row.name}`}><Icon name="trash" size={15}/></button></div></td>
                    </tr>)}
                  </tbody></table></div>
                <div className="table-foot"><span>{filteredDocking.length} of {docking.length} requests • {docking.reduce((a,b)=>a+b.request,0)} total units</span><button className="link-btn" onClick={()=>{setDockingStatusFilter("All"); push("Refreshed","success")}}>Refresh</button></div>
              </section>
            </Reveal>
            <Reveal delay={170}>
              <section className="panel truck-panel">
                <div className="panel-heading"><h2>Truck Size Trend</h2><button className="more-button" onClick={()=>push("Truck options","info")} aria-label="More options"><Icon name="more" size={18}/></button></div>
                <div className="trend-select"><button className={truckPeriod==="All sizes"?"active":""} onClick={()=>setTruckPeriod("All sizes")}>All sizes</button><button className={truckPeriod==="This week"?"active":""} onClick={()=>setTruckPeriod("This week")}>This week</button></div>
                <div className="donut-wrap">
                  <div className="donut-chart" style={{ background: `conic-gradient(#b6d41b 0 ${currentTruck.large}%, #cfe5a0 ${currentTruck.large}% ${currentTruck.large+currentTruck.medium}%, #e7e8e8 ${currentTruck.large+currentTruck.medium}% 100%)` }}><div><strong>{currentTruck.total}</strong><span>Requests</span></div></div>
                  <div className="donut-center-dot"/>
                </div>
                <div className="trend-legend">
                  <button className="legend-row" onClick={()=>push("Large trucks: 45% utilization","info")}><span><i className="legend-square lime-square"/>Large truck <b>{currentTruck.large}%</b></span><Icon name="chevron" size={12}/></button>
                  <button className="legend-row" onClick={()=>push("Medium trucks: 32%","info")}><span><i className="legend-square mint-square"/>Medium truck <b>{currentTruck.medium}%</b></span><Icon name="chevron" size={12}/></button>
                  <button className="legend-row" onClick={()=>push("Small trucks: 23%","info")}><span><i className="legend-square gray-square"/>Small truck <b>{currentTruck.small}%</b></span><Icon name="chevron" size={12}/></button>
                </div>
                <button className="dark-button full-button" onClick={()=>push(`Showing ${currentTruck.total} truck requests breakdown`,"success")}>See Details</button>
                <div className="truck-footnote">Auto-updated • LH sync 2 min ago</div>
              </section>
            </Reveal>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAdd && <Modal title="Add New Product" onClose={()=>setShowAdd(false)}><ProductForm onSubmit={handleAddProduct} onCancel={()=>setShowAdd(false)} tags={tags}/></Modal>}
      {editingInv && <Modal title="Edit Product" onClose={()=>setEditingInv(null)}><ProductForm initial={editingInv} onSubmit={(data)=>{ setInventory(v=>v.map(x=> x.id===editingInv.id ? { ...x, ...data, id:x.id } : x)); push("Product updated","success"); setEditingInv(null); }} onCancel={()=>setEditingInv(null)} tags={tags} /></Modal>}
      {editingDock && <Modal title="Edit LH Request" onClose={()=>setEditingDock(null)}><DockForm initial={editingDock} onSubmit={(d)=>{ setDocking(v=>v.map(x=> x.id===editingDock.id ? {...x, ...d}:x)); push("Request updated","success"); setEditingDock(null); }} onCancel={()=>setEditingDock(null)}/></Modal>}
      {showAddTag && <Modal title="Add Tag" onClose={()=>setShowAddTag(false)} small>
        <div className="form-grid"><label>Tag name<input value={newTagName} onChange={e=>setNewTagName(e.target.value)} placeholder="e.g. Seasonal" autoFocus onKeyDown={e=> e.key==="Enter" && handleAddTag()}/></label><div className="form-actions"><button className="ghost-button" onClick={()=>setShowAddTag(false)}>Cancel</button><button className="dark-button" onClick={handleAddTag}>Create Tag</button></div></div>
      </Modal>}

      {/* Toasts */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t=> <div key={t.id} className={`toast ${t.tone}`}><Icon name={t.tone==="error"?"alert":t.tone==="success"?"check":"bell"} size={16}/><span>{t.text}</span></div>)}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, small }: {title:string; children:ReactNode; onClose:()=>void; small?:boolean}){
  useEffect(()=>{ const h=(e:KeyboardEvent)=> e.key==="Escape" && onClose(); window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box ${small?"small":""}`} onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button onClick={onClose} aria-label="Close modal"><Icon name="close" size={18}/></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSubmit, onCancel, tags }: {initial?:Partial<InventoryItem>; onSubmit:(d: Omit<InventoryItem,"id"> & {request?:number})=>void; onCancel:()=>void; tags:string[]}){
  const [name,setName]=useState(initial?.name||"");
  const [sku,setSku]=useState(initial?.sku||`SKU-${Math.floor(300+Math.random()*200)}`);
  const [qty,setQty]=useState(String(initial?.qty||200));
  const [stock,setStock]=useState(String(initial?.stock||150));
  const [price,setPrice]=useState(initial?.price||"$4K");
  const [tag,setTag]=useState(initial?.tag||tags[0]);
  const [imageKey,setImageKey]=useState(initial?.imageKey||"helmet");
  const [request,setRequest]=useState("50");
  const invalid=!name.trim() || !qty || !stock;
  return (
    <form className="form-grid" onSubmit={e=>{e.preventDefault(); if(invalid) return; const priceNum=parseInt(price.replace(/\D/g,""))||0; onSubmit({ name:name.trim(), sku, qty: parseInt(qty)||0, stock: parseInt(stock)||0, price, priceNum, tag, imageKey, request: parseInt(request)||0 });}}>
      <div className="form-row-2"><label>Product name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Backpack" required/></label><label>SKU<input value={sku} onChange={e=>setSku(e.target.value)}/></label></div>
      <div className="form-row-2"><label>Total Qty<input type="number" min={0} value={qty} onChange={e=>setQty(e.target.value)}/></label><label>Stock In<input type="number" min={0} value={stock} onChange={e=>setStock(e.target.value)}/></label></div>
      <div className="form-row-2"><label>Price<input value={price} onChange={e=>setPrice(e.target.value)} placeholder="$4K"/></label><label>Category<select value={tag} onChange={e=>setTag(e.target.value)}>{tags.map(t=><option key={t} value={t}>{t}</option>)}</select></label></div>
      <div className="form-row-2"><label>Image<select value={imageKey} onChange={e=>setImageKey(e.target.value)}>{Object.keys(productImages).map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>LH Request units<input type="number" min={0} value={request} onChange={e=>setRequest(e.target.value)}/></label></div>
      {invalid && <span className="form-error">Product name, qty and stock are required.</span>}
      <div className="form-preview"><ProductThumb type={imageKey}/><div><strong>{name||"Preview"}</strong><span>{sku} • {tag}</span></div><span className="preview-price">{price}</span></div>
      <div className="form-actions"><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button><button type="submit" className="dark-button" disabled={invalid}> {initial?.name ? "Save Changes":"Add Product"}</button></div>
    </form>
  );
}
function DockForm({ initial, onSubmit, onCancel }: {initial:DockingItem; onSubmit:(d:Partial<DockingItem>)=>void; onCancel:()=>void}){
  const [name,setName]=useState(initial.name);
  const [detail,setDetail]=useState(initial.detail);
  const [request,setRequest]=useState(String(initial.request));
  const [status,setStatus]=useState<DockingItem["status"]>(initial.status);
  return (
    <form className="form-grid" onSubmit={e=>{e.preventDefault(); onSubmit({ name, detail, request: parseInt(request)||0, status, tone: status==="Assigned"?"green": status==="Pending" && detail.toLowerCase().includes("low") ?"red":"yellow" });}}>
      <label>Product<input value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Detail<input value={detail} onChange={e=>setDetail(e.target.value)}/></label>
      <div className="form-row-2"><label>Request units<input type="number" value={request} onChange={e=>setRequest(e.target.value)}/></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value as DockingItem["status"])}><option>Assigned</option><option>Pending</option></select></label></div>
      <div className="form-actions"><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button><button type="submit" className="dark-button">Save Request</button></div>
    </form>
  );
}
