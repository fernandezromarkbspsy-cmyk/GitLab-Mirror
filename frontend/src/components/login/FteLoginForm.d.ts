interface FteLoginFormProps {
    email: string;
    code: string;
    codeSent: boolean;
    resendAfter: number;
    busy: boolean;
    error: string;
    onEmailChange: (value: string) => void;
    onCodeChange: (value: string) => void;
    onSubmit: (e: React.FormEvent, submittedCode?: string) => void;
    onResendCode: () => void;
    onGoogleSignIn: () => void;
}
export declare function FteLoginForm({ email, code, codeSent, resendAfter, busy, error, onEmailChange, onCodeChange, onSubmit, onResendCode, onGoogleSignIn, }: FteLoginFormProps): import("react").JSX.Element;
export {};
