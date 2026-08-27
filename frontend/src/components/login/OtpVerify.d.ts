import { type FormEvent } from 'react';
interface OtpVerifyProps {
    destination: string;
    resendAfter: number;
    onBack: () => void;
    onDone: (event: FormEvent<HTMLFormElement>, code: string) => void;
    onResend: () => void;
    backLabel?: string;
}
export declare function OtpVerify({ destination, resendAfter, onBack, onDone, onResend, backLabel, }: OtpVerifyProps): import("react").JSX.Element;
export {};
