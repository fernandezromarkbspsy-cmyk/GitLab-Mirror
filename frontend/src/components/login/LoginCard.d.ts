import { ReactNode } from 'react';
interface LoginCardProps {
    children: ReactNode;
    modal?: boolean;
    visible?: boolean;
}
export declare function LoginCard({ children, modal, visible }: LoginCardProps): import("react").JSX.Element;
export {};
