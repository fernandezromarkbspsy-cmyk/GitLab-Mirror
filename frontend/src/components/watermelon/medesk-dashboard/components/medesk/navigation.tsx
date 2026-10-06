<<<<<<< HEAD
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

type DashboardNavigation = {
  pathname: string;
  navigate: (pathname: string) => void;
};

const DashboardNavigationContext = createContext<DashboardNavigation | null>(
  null,
);

export function DashboardNavigationProvider({
  children,
  pathname = "/",
  navigate,
}: {
  children: ReactNode;
  pathname?: string;
  navigate?: (pathname: string) => void;
}) {
  const [localPathname, setLocalPathname] = useState(pathname);
  const currentPathname = navigate ? pathname : localPathname;
  const handleNavigate = navigate ?? setLocalPathname;
  const value = useMemo(
    () => ({ pathname: currentPathname, navigate: handleNavigate }),
    [currentPathname, handleNavigate],
  );

  return (
    <DashboardNavigationContext.Provider value={value}>
      {children}
    </DashboardNavigationContext.Provider>
  );
}

export function useDashboardNavigation() {
  const context = useContext(DashboardNavigationContext);

  if (!context) {
    throw new Error(
      "useDashboardNavigation must be used within DashboardNavigationProvider",
    );
  }

  return context;
=======
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Retains the template API without installing a second router.
export function DashboardNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useDashboardNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return {
    pathname,
    navigate: (path: string) => navigate(path),
  };
>>>>>>> c236f8f (medesk-nav)
}

export function DashboardLink({
  href,
<<<<<<< HEAD
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useDashboardNavigation();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(href);
  }

  return <a href={href} onClick={handleClick} {...props} />;
=======
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props} />;
>>>>>>> c236f8f (medesk-nav)
}
