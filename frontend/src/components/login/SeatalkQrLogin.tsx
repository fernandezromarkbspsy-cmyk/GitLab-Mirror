import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Loader2 } from 'lucide-react';
import {
  createSeatalkLoginTransaction,
  getSeatalkTransactionResult,
  type SeatalkLoginTransaction,
} from '../../lib/seatalk';

interface SeatalkQrLoginProps {
  onError: (error: string) => void;
  enabled?: boolean;
}

export function SeatalkQrLogin({ onError, enabled = true }: SeatalkQrLoginProps) {
  const [transaction, setTransaction] = useState<SeatalkLoginTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const pollingRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollTransaction = useCallback(async (activeTransaction: SeatalkLoginTransaction) => {
    try {
      const result = await getSeatalkTransactionResult(activeTransaction.transactionId, activeTransaction.transactionToken);
      if (result.status === 'complete' && result.sessionUrl) {
        if (completedRef.current) return;
        completedRef.current = true;
        stopPolling();
        window.location.assign(result.sessionUrl);
      } else if (result.status === 'failed') {
        stopPolling();
        onError(result.message || 'SeaTalk could not verify this login. Please try again.');
      }
    } catch (error) {
      stopPolling();
      onError(error instanceof Error ? error.message : 'SeaTalk login transaction expired.');
    }
  }, [onError, stopPolling]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let disposed = false;

    const initialize = async () => {
      try {
        const nextTransaction = await createSeatalkLoginTransaction();
        if (disposed) return;
        setTransaction(nextTransaction);
        pollingRef.current = window.setInterval(() => void pollTransaction(nextTransaction), 2000);
      } catch (error) {
        if (!disposed) onError(error instanceof Error ? error.message : 'Failed to initialize SeaTalk login.');
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void initialize();
    return () => {
      disposed = true;
      stopPolling();
    };
  }, [enabled, onError, pollTransaction, stopPolling]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'seatalk_callback') return;
      if (transaction && event.data.transactionId === transaction.transactionId) {
        void pollTransaction(transaction);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pollTransaction, transaction]);

  const handleQrClick = () => {
    if (!transaction || isScanning || loading) return;

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      transaction.loginUrl,
      'seatalk_login',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    if (!popup) {
      onError('Popup blocked. Please allow popups for this site.');
      return;
    }

    setIsScanning(true);
    const checkClosed = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(checkClosed);
      setIsScanning(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="mt-2 text-sm text-muted">Preparing QR code...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {transaction && (
        <button
          onClick={handleQrClick}
          type="button"
          aria-label="Click to open SeaTalk login"
          className="relative z-10 cursor-pointer rounded-xl bg-white p-2.5 shadow-2xl shadow-[#141f3d]/40 ring-1 ring-white/50 outline-none transition-all duration-700 ease-out transform-gpu hover:z-20 hover:-translate-y-1 hover:scale-125 hover:shadow-[0_24px_48px_-18px_rgba(14,24,54,0.6)] focus-visible:z-20 focus-visible:-translate-y-1 focus-visible:scale-125 focus-visible:ring-4 focus-visible:ring-accent/30"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') handleQrClick();
          }}
        >
          <QRCodeSVG value={transaction.loginUrl} size={124} bgColor="#ffffff" fgColor="#0d1730" level="M" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded bg-white px-1.5 py-1 shadow-md">
              <span className="text-accent font-display text-xs font-bold tracking-tight">S5</span>
            </div>
          </div>
          <span className="qr-scan" aria-hidden />
        </button>
      )}

      <div className="mt-3.5 flex items-center gap-1.5">
        <Camera className="h-4 w-4 text-link" strokeWidth={2.2} />
        {isScanning ? (
          <><Loader2 className="h-4 w-4 animate-spin text-accent" /><span className="font-display text-[12.5px] font-bold text-ink leading-snug tracking-tight">Authenticating...</span></>
        ) : (
          <span className="font-display text-[12.5px] font-bold text-ink leading-snug tracking-tight">Scan or Click to Login</span>
        )}
      </div>
      <p className="mt-1.5 max-w-[215px] text-center text-[11.5px] leading-snug text-muted">
        {isScanning ? 'Please wait while we authenticate your account...' : 'Scan with mobile app or click to login via SeaTalk'}
      </p>
    </div>
  );
}
