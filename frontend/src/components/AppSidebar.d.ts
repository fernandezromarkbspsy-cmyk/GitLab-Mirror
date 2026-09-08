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
export declare function AppSidebar({ user, activeView, open, onOpenChange, onNavigate, onSignOut, pendingCount, }: Props): import("react").JSX.Element;
export {};
