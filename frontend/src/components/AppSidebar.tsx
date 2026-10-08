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
  "fixed bottom-4 left-4 z-40 hidden items-center gap-2 rounded-xl border border-[#dfe4e1] bg-white px-3 py-2 text-xs font-medium text-[#33403f] shadow-[0_.7rem_1.5rem_rgb(25_45_47_/_12%)] max-[960px]:inline-flex";
const scrimClass =
  "fixed inset-0 z-25 hidden bg-[rgb(15_31_31_/_26%)] opacity-0 transition-[opacity,visibility] duration-[250ms] ease-[ease] max-[960px]:block max-[960px]:invisible";
const sidebarClass =
  "fixed inset-y-0 left-0 z-30 flex w-[15.5rem] flex-col border-r border-[#e2e8e5] bg-[#fbfcfb] text-[#6d7a79] transition-transform duration-[280ms] ease-[ease] max-[1100px]:w-[14rem] max-[960px]:-translate-x-full max-[960px]:shadow-[.7rem_0_2rem_rgb(25_45_47_/_14%)]";
const navItemClass =
  "relative flex min-h-[2.55rem] w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-sm font-medium leading-snug text-[#71807f] transition-[color,background,border-color,box-shadow,transform] duration-200 ease-[ease] hover:bg-[#f2f5f4] hover:text-[#243534] focus-visible:outline-[.15rem] focus-visible:outline-[#8d9a97] focus-visible:outline-offset-[.1rem] [&_svg]:size-[1.05rem] [&_svg]:shrink-0";
const activeNavItemClass =
  "bg-[#eef1f0] font-semibold text-[#273837] shadow-[inset_0_0_0_1px_rgb(95_112_108_/_10%)] before:absolute before:top-1/2 before:left-0 before:h-[1.4rem] before:w-[.2rem] before:-translate-y-1/2 before:rounded-r-full before:bg-[#667773] before:content-['']";
const groupToggleClass = `${navItemClass} justify-start`;
const subItemClass =
  "relative mt-1 ml-2 flex min-h-[2.25rem] w-full items-center gap-3 rounded-lg border border-transparent py-1 pr-2 pl-4 text-left text-sm font-medium leading-snug text-[#879391] transition-[color,background,border-color,box-shadow,transform] duration-200 ease-[ease] hover:bg-[#f2f5f4] hover:text-[#243534] focus-visible:outline-[.15rem] focus-visible:outline-[#8d9a97] focus-visible:outline-offset-[.1rem] animate-[sidebar-subitem-in_.2s_ease_both] [&_svg]:size-4 [&_svg]:shrink-0";
const activeSubItemClass = activeNavItemClass;

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
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia("(max-width: 960px)").matches,
  );
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const previousOpen = useRef(open);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

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
      <aside
        className={`${sidebarClass}${open ? " max-[960px]:translate-x-0!" : ""}`}
        aria-hidden={isMobile && !open}
        inert={isMobile && !open ? true : undefined}
      >
        <nav id="primary-navigation" aria-label="Primary navigation" className="contents">
        <div className="flex min-h-[4.5rem] items-center gap-3 border-b border-[#e7ece9] px-5">
          <div className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#dfe7e3] bg-[#eef3f0] shadow-[0_.25rem_.6rem_rgb(25_45_47_/_8%)]">
            <img className="block size-full object-cover" src="/dashboard-icon/icon_logo.png" alt="SOC 5" />
          </div>
          <div className="grid min-w-0 gap-[.1rem]">
            <strong className="text-base font-semibold tracking-tight text-[#273837]">SOC 5</strong>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 pb-4 [scrollbar-color:#cdd8d4_transparent] scrollbar-thin">
          <div className="mb-[.9rem]">
            <p className="mb-2 px-3 text-xs font-medium text-[#a0adaa]">Workspace</p>
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
              <p className="mb-2 px-3 text-xs font-medium text-[#a0adaa]">Outbound</p>
              <button
                className={`${groupToggleClass}${visibleGroup === "outbound" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                aria-expanded={visibleGroup === "outbound"}
                aria-label="Toggle outbound requests"
                onClick={() => toggleGroup("outbound")}
              >
                <Route size={17} />
                <span>Requests</span>
                <ChevronRight
                  size={15}
                  className={`ml-auto transition-transform duration-200 ${visibleGroup === "outbound" ? "rotate-90" : ""}`}
                />
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
                    <span className="ml-auto grid min-h-[1.2rem] min-w-[1.2rem] place-items-center rounded-md border border-[#dce5e1] bg-[#f4f7f5] px-1 text-xs font-semibold tabular-nums text-[#53635f]">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {showMidmile && (
            <div className="mb-[.9rem]">
              <p className="mb-2 px-3 text-xs font-medium text-[#a0adaa]">Midmile</p>
              <button
                className={`${groupToggleClass}${visibleGroup === "midmile" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                aria-expanded={visibleGroup === "midmile"}
                aria-label="Toggle midmile requests"
                onClick={() => toggleGroup("midmile")}
              >
                <Truck size={17} />
                <span>Requests</span>
                <ChevronRight
                  size={15}
                  className={`ml-auto transition-transform duration-200 ${visibleGroup === "midmile" ? "rotate-90" : ""}`}
                />
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
                    <span className="ml-auto grid min-h-[1.2rem] min-w-[1.2rem] place-items-center rounded-md border border-[#dce5e1] bg-[#f4f7f5] px-1 text-xs font-semibold tabular-nums text-[#53635f]">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {showDocking && (
            <div className="mb-[.9rem]">
              <p className="mb-2 px-3 text-xs font-medium text-[#a0adaa]">Docking</p>
              <button
                className={`${navItemClass}${activeView === "docking" ? ` ${activeNavItemClass}` : ""}`}
                type="button"
                onClick={() => navigate("docking")}
              >
                <ShipWheel size={18} />
                <span>Docking Confirmation</span>
                {pendingCount > 0 && (
                  <span className="ml-auto grid min-h-[1.2rem] min-w-[1.2rem] place-items-center rounded-md border border-[#dce5e1] bg-[#f4f7f5] px-1 text-xs font-semibold tabular-nums text-[#53635f]">{pendingCount}</span>
                )}
              </button>
            </div>
          )}
          {showKpi && (
            <div className="mb-[.9rem]">
              <p className="mb-2 px-3 text-xs font-medium text-[#a0adaa]">Performance</p>
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
              <p className="mb-2 px-3 text-xs font-medium text-[#a0adaa]">Administration</p>
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

        <div className="flex min-h-[4.75rem] items-center gap-3 border-t border-[#e7ece9] px-4 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#dce5e1] bg-[#eef3f0] text-xs font-bold text-[#53635f]" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="grid min-w-0 gap-[.1rem]">
            <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-[#33403f]">{user.name}</strong>
            <small className="text-xs text-[#91a09d]">{roleNames[user.role]}</small>
          </div>
          <button
            className="ml-auto grid size-8 place-items-center rounded-lg bg-transparent text-[#8b9996] transition-[color,background,transform] duration-200 hover:-translate-y-px hover:bg-[#f2f5f4] hover:text-[#33403f] focus-visible:outline-[.15rem] focus-visible:outline-[#8d9a97] focus-visible:outline-offset-[.1rem]"
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
