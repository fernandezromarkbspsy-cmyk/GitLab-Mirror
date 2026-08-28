import type { ReactNode } from 'react';
type PanelProps = {
    kicker: string;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
};
export declare function Panel({ kicker, title, description, action, className, children }: PanelProps): import("react").JSX.Element;
export {};
