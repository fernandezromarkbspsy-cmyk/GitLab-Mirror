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
}

export function DashboardLink({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props} />;
}
