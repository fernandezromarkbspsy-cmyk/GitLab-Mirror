import { type ReactNode } from 'react';
type Props = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    ariaLabelledBy?: string;
    ariaLabel?: string;
    role?: 'dialog' | 'alertdialog';
};
export declare function Modal({ open, onClose, children, className, ariaLabelledBy, ariaLabel, role }: Props): import("react").JSX.Element | null;
export {};
