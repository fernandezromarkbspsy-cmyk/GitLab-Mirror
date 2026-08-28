import type { ReactNode } from 'react';
type ChartHeaderProps = {
    kicker: string;
    title: string;
    description: string;
    controls: ReactNode;
};
export declare function ChartHeader({ kicker, title, description, controls }: ChartHeaderProps): import("react").JSX.Element;
export {};
