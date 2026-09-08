type Option = {
    key: string;
    label: string;
};
type Props = {
    label?: string;
    options: Option[];
    visible: string[];
    onChange: (next: string[]) => void;
};
export declare function ColumnVisibilityMenu({ label, options, visible, onChange }: Props): import("react").JSX.Element;
export {};
