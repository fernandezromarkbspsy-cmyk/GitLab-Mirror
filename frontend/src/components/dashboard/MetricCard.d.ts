import type { ReactNode } from 'react';
type MetricCardProps = {
    label: string;
    value: ReactNode;
    icon: ReactNode;
    chip: string;
    footnote: ReactNode;
    primary?: boolean;
    onClick: () => void;
};
export declare function MetricCard({ label, value, icon, chip, footnote, primary, onClick }: MetricCardProps): import("react").JSX.Element;
export {};
