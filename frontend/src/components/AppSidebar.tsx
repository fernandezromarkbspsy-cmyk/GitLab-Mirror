import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PanelLeftOpen,
  Route,
  ShipWheel,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppView, User } from "../types";

type Props = {
  user: User;
  activeView: AppView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
  onSignOut: () => void;
  pendingCount: number;
};

const roleNames = {
  ops_pic: "Ops PIC",
  fte_ops: "FTE Ops",
  fte_mm: "FTE Midmile",
  doc_officer: "Document Officer",
} as const;

type MenuGroup = "outbound" | "midmile";

const mobileToggleClass =
  "fixed bottom-[.6rem] left-[.6rem] z-40 hidden items-center gap-[.25rem] rounded-lg bg-soc5-lime px-2 py-[.4rem] text-xs font-medium text-soc5-ink shadow-[0_.4rem_1rem_rgb(0_0_0_/_12%)] max-[960px]:inline-flex";
const scrimClass =
  "fixed inset-0 z-25 hidden bg-[rgb(17_18_19_/_42%)] opacity-0 transition-[opacity,visibility] duration-[250ms] ease-[ease] max-[960px]:block max-[960px]:invisible";
const sidebarClass =
  "fixed inset-y-0 left-0 z-30 flex w-[9.5rem] flex-col border-r border-[#39393b] bg-soc5-sidebar text-[#929398] transition-transform duration-[280ms] ease-[ease] max-[1100px]:w-[9rem] max-[960px]:-translate-x-full max-[960px]:shadow-[.7rem_0_2rem_rgb(0_0_0_/_20%)]";
const navItemClass =
  "relative flex min-h-[1.85rem] w-full items-center gap-2 rounded-lg border border-transparent px-2 text-left text-xs font-medium leading-snug text-[#a3a5a9] transition-[color,background,border-color,box-shadow,transform] duration-200 ease-[ease] hover:translate-x-[.1rem] hover:bg-[linear-gradient(180deg,rgb(255_255_255_/_4%),rgb(255_255_255_/_2%))] hover:text-[#f2f6ff] focus-visible:outline-[.1rem] focus-visible:outline-soc5-lime focus-visible:outline-offset-[.1rem]";
const activeNavItemClass =
  "bg-[linear-gradient(90deg,rgb(214_250_45_/_12%),rgb(255_255_255_/_3%))] font-semibold text-[#f2f6ff] before:absolute before:top-1/2 before:left-[-.45rem] before:h-5 before:w-[.15rem] before:-translate-y-1/2 before:rounded-r-[.3rem] before:bg-[linear-gradient(180deg,#d9ff2d,#a7d62b)] before:shadow-[0_0_.8rem_rgb(214_250_45_/_40%)] before:content-['']";
const groupToggleClass = `${navItemClass} justify-start`;
const subItemClass =
  "relative mt-1 ml-[.3rem] flex min-h-[1.45rem] w-full items-center gap-2 rounded-r-lg border border-transparent bg-[rgb(255_255_255_/_2%)] py-0 pr-2 pl-[1.45rem] text-left text-xs font-medium leading-snug text-[#a3a5a9] transition-[color,background,border-color,box-shadow,transform] duration-200 ease-[ease] hover:translate-x-[.1rem] hover:bg-[linear-gradient(90deg,rgb(214_250_45_/_7%),rgb(255_255_255_/_3%))] hover:text-[#f2f6ff] focus-visible:outline-[.1rem] focus-visible:outline-soc5-lime focus-visible:outline-offset-[.1rem] animate-[sidebar-subitem-in_.2s_ease_both]";
const activeSubItemClass = `${activeNavItemClass} bg-[linear-gradient(90deg,rgb(214_250_45_/_7%),rgb(255_255_255_/_3%))]`;

function groupForView(view: AppView): MenuGroup | null {
  if (view === "lh-request") return "outbound";
  if (view === "truck-request") return "midmile";
  return null;
}

export function AppSidebar({
  user,
  activeView,
  open,
  onOpenChange,
  onNavigate,
  onSignOut,
  pendingCount,
}: Props) {
  const showOutbound =
    user.role === "ops_pic" ||
    user.role === "fte_ops" ||
    user.role === "doc_officer";
  const showMidmile = user.role === "fte_mm";
  const showDocking = user.role === "doc_officer";
  const showKpi = true;
  const showUsers = user.role === "fte_ops" || user.role === "fte_mm";
  const [expanded, setExpanded] = useState<MenuGroup | null>(() =>
    groupForView(activeView),
  );
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const previousOpen = useRef(open);

  useEffect(() => {
    setExpanded(groupForView(activeView));
  }, [activeView]);

  useEffect(() => {
    if (previousOpen.current && !open && window.matchMedia("(max-width: 960px)").matches) {
      mobileToggleRef.current?.focus();
    }
    previousOpen.current = open;
  }, [open]);

  function toggleGroup(group: MenuGroup) {
    setExpanded((value) => (value === group ? null : group));
  }
  const visibleGroup = expanded;

  function navigate(view: AppView) {
    onNavigate(view);
    onOpenChange(false);
  }

  return (
    <>
      <button
        ref={mobileToggleRef}
        className={mobileToggleClass}
        type="button"
        title="Open navigation"
        aria-label="Open navigation"
        aria-controls="primary-navigation"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
      >
        <PanelLeftOpen size={18} aria-hidden="true" />
        <span>Menu</span>
      </button>
      <button
        type="button"
        aria-label="Close navigation"
        aria-controls="primary-navigation"
        className={`${scrimClass}${open ? " max-[960px]:visible max-[960px]:opacity-100" : ""}`}
        onClick={() => onOpenChange(false)}
      />
      <aside className={`${sidebarClass}${open ? " max-[960px]:translate-x-0!" : ""}`}>
        <nav id="primary-navigation" aria-label="Primary navigation" className="contents">
        <div className="flex min-h-[3.8rem] items-center gap-[.45rem] border-b border-[#39393b] py-0 pr-[.95rem] pl-5">
          <div className="relative grid size-[1.6rem] shrink-0 place-items-center overflow-hidden rounded-[.35rem] bg-soc5-lime">
            <img className="block size-full object-cover" src="/dashboard-icon/icon_logo.png" alt="SOC 5" />
          </div>
          <div className="grid min-w-0 gap-[.1rem]">
            <strong className="text-sm font-semibold tracking-tight text-[#f7f7f7]">SOC 5</strong>
            <small className="whitespace-nowrap text-xs text-soc5-muted">
              
            </small>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-[.9rem] pb-[.8rem] [scrollbar-color:#454548_transparent] scrollbar-thin">
          <div className="mb-[.9rem]">
            <p className="mb-[.4rem] ml-2 text-xs font-semibold text-[#7d7e83]">Workspace</p>
            <button
              className={`${navItemClass}${activeView === "overview" ? ` ${activeNavItemClass}` : ""}`}
              type="button"
              onClick={() => navigate("overview")}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          </div>
          {showOutbound && (
            <div className="mb-[.9rem]">
              <p className="mb-[.4rem] ml-2 text-xs font-semibold text-[#7d7e83]">Outbound</p>
              <button
                className={`${groupToggleClass}${visibleGroup === "outbound" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                aria-expanded={visibleGroup === "outbound"}
                aria-label="Toggle outbound requests"
                onClick={() => toggleGroup("outbound")}
              >
                <Route size={17} />
                <span>Requests</span>
                <ChevronRight size={15} className="ml-auto transition-transform duration-200 aria-expanded:rotate-90" />
              </button>
              {visibleGroup === "outbound" && (
                <button
                  className={`${subItemClass}${activeView === "lh-request" ? ` ${activeSubItemClass}` : ""}`}
                  type="button"
                  onClick={() => navigate("lh-request")}
                >
                  <Route size={17} />
                  <span>LH Request</span>
                  {user.role === "fte_ops" && pendingCount > 0 && (
                    <span className="ml-auto grid min-h-[.85rem] min-w-[.85rem] place-items-center rounded-full bg-[linear-gradient(180deg,#dfff50,#c7eb2d)] px-[.2rem] text-xs font-semibold tabular-nums text-[#1a1b1d] shadow-[0_0_0_.1rem_rgb(17_17_18/20%)]">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {showMidmile && (
            <div className="mb-[.9rem]">
              <p className="mb-[.4rem] ml-2 text-xs font-semibold text-[#7d7e83]">Midmile</p>
              <button
                className={`${groupToggleClass}${visibleGroup === "midmile" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                aria-expanded={visibleGroup === "midmile"}
                aria-label="Toggle midmile requests"
                onClick={() => toggleGroup("midmile")}
              >
                <Truck size={17} />
                <span>Requests</span>
                <ChevronRight size={15} className="ml-auto transition-transform duration-200 aria-expanded:rotate-90" />
              </button>
              {visibleGroup === "midmile" && (
                <button
                  className={`${subItemClass}${activeView === "truck-request" ? ` ${activeSubItemClass}` : ""}`}
                  type="button"
                  onClick={() => navigate("truck-request")}
                >
                  <Truck size={17} />
                  <span>Truck Request</span>
                  {pendingCount > 0 && (
                    <span className="ml-auto grid min-h-[.85rem] min-w-[.85rem] place-items-center rounded-full bg-[linear-gradient(180deg,#dfff50,#c7eb2d)] px-[.2rem] text-xs font-semibold tabular-nums text-[#1a1b1d] shadow-[0_0_0_.1rem_rgb(17_17_18/20%)]">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {showDocking && (
            <div className="mb-[.9rem]">
              <p className="mb-[.4rem] ml-2 text-xs font-semibold text-[#7d7e83]">Docking</p>
              <button
                className={`${navItemClass}${activeView === "docking" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                onClick={() => navigate("docking")}
              >
                <ShipWheel size={18} />
                <span>Docking Confirmation</span>
                {pendingCount > 0 && (
                  <span className="ml-auto grid min-h-[.85rem] min-w-[.85rem] place-items-center rounded-full bg-[linear-gradient(180deg,#dfff50,#c7eb2d)] px-[.2rem] text-xs font-semibold tabular-nums text-[#1a1b1d] shadow-[0_0_0_.1rem_rgb(17_17_18/20%)]">{pendingCount}</span>
                )}
              </button>
            </div>
          )}
          {showKpi && (
            <div className="mb-[.9rem]">
              <p className="mb-[.4rem] ml-2 text-xs font-semibold text-[#7d7e83]">Performance</p>
              <button
                className={`${navItemClass}${activeView === "kpi" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                onClick={() => navigate("kpi")}
              >
                <BarChart3 size={18} />
                <span>KPI</span>
              </button>
            </div>
          )}
          {showUsers && (
            <div className="mb-[.9rem]">
              <p className="mb-[.4rem] ml-2 text-xs font-semibold text-[#7d7e83]">Administration</p>
              <button
                className={`${navItemClass}${activeView === "users" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                onClick={() => navigate("users")}
              >
                <Users size={18} />
                <span>User Management</span>
              </button>
            </div>
          )}
        </nav>

        <div className="flex min-h-[3.6rem] items-center gap-2 border-t border-[#39393b] bg-[linear-gradient(180deg,rgb(255_255_255/3%),rgb(255_255_255/1%))] px-[.7rem] py-2 pl-[.9rem]">
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#6d89d7,#243b80)] text-xs font-bold text-[#d6e2ff]" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="grid min-w-0 gap-[.1rem]">
            <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-[#efefef]">{user.name}</strong>
            <small className="text-xs text-[#85868a]">{roleNames[user.role]}</small>
          </div>
          <button
            className="ml-auto grid size-[1.4rem] place-items-center rounded-md bg-transparent text-soc5-muted transition-[color,background,transform] duration-200 hover:-translate-y-px hover:bg-[#2a2a2d] hover:text-soc5-lime focus-visible:outline-[.1rem] focus-visible:outline-soc5-lime focus-visible:outline-offset-[.1rem]"
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={onSignOut}
          >
            <LogOut size={18} />
          </button>
        </div>
        </nav>
      </aside>
    </>
  );
}
