import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDetected: (code: string) => void;
}

const SCANNER_ID = "html5-qr-scanner-view";

export function BarcodeScanner({ open, onOpenChange, onDetected }: Props) {
  const { t } = useApp();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted || !open) return;

    let cancelled = false;

    const startScanner = async () => {
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;

      const el = document.getElementById(SCANNER_ID);
      if (!el) return;

      try {
        const scanner = new Html5Qrcode(SCANNER_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 140 } },
          (text) => {
            if (cancelled) return;
            onDetected(text);
            close();
          },
          () => {},
        );
      } catch {
        if (!cancelled) setError(t.scanner.permissionDenied);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
    };
  }, [mounted, open]);

  const close = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current = null;
          setMounted(false);
          onOpenChange(false);
        });
    } else {
      setMounted(false);
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ touchAction: "none" }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white font-semibold text-base">{t.scanner.title}</span>
        <button
          onClick={close}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {error ? (
          <div className="text-white text-center px-6 space-y-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm"
            >
              {t.scanner.cancel}
            </button>
          </div>
        ) : (
          <>
            <div
              id={SCANNER_ID}
              className="w-full"
              style={{ maxWidth: 400 }}
            />
            <p className="text-white/70 text-sm mt-4 text-center px-6">
              {t.scanner.hint}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
