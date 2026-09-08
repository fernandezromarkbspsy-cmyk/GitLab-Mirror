interface BackroomLoginFormProps {
    opsId: string;
    password: string;
    showPassword: boolean;
    busy: boolean;
    error: string;
    onOpsIdChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onTogglePassword: () => void;
    onSubmit: (e: React.FormEvent) => void;
}
export declare function BackroomLoginForm({ opsId, password, showPassword, busy, error, onOpsIdChange, onPasswordChange, onTogglePassword, onSubmit, }: BackroomLoginFormProps): import("react").JSX.Element;
export {};
