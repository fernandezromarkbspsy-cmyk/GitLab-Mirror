import type { UserType } from '../../pages/Login';
interface UserTypeToggleProps {
    value: UserType;
    onChange: (value: UserType) => void;
}
export declare function UserTypeToggle({ value, onChange }: UserTypeToggleProps): import("react").JSX.Element;
export {};
