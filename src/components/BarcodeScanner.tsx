import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDetected: (code: string) => void;
}

export function BarcodeScanner({ open, onOpenChange, onDetected }: Props) {
  const { t } = useApp();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-scanner-container";

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    const timeout = setTimeout(() => {
      const el = document.getElementById(containerId);
      if (!el) return;

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onDetected(decodedText);
            onOpenChange(false);
          },
          () => {},
        )
        .catch(() => {
          onOpenChange(false);
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.scanner.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">{t.scanner.hint}</p>
        <div
          id={containerId}
          className="w-full rounded-lg overflow-hidden bg-black"
          style={{ minHeight: 220 }}
        />
      </DialogContent>
    </Dialog>
  );
}
