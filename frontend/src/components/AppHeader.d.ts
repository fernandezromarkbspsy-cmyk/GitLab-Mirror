import type { AppView, Role, User } from '../types';
type Props = {
    user: User;
    view: AppView;
    onRoleChange: (role: Role) => void;
    onSearch: () => void;
};
export declare function AppHeader({ user, view, onRoleChange, onSearch }: Props): import("react").JSX.Element;
export {};
