import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDetected: (code: string) => void;
}

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(image: HTMLVideoElement): Promise<Array<{ rawValue: string; format: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

const FORMATS = [
  "ean_13", "ean_8", "code_128", "code_39",
  "qr_code", "upc_a", "upc_e", "itf", "codabar",
];

export function BarcodeScanner({ open, onOpenChange, onDetected }: Props) {
  const { t } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    rafRef.current = null;
    detectorRef.current = null;
  };

  const close = () => {
    stopAll();
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      stopAll();
      setStatus("loading");
      return;
    }

    let cancelled = false;

    const init = async () => {
      setStatus("loading");
      setErrorMsg("");

      try {
        // 1. Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // 2. Attach to video element
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("muted", "true");
        await video.play();

        if (cancelled) return;

        // 3. Set up BarcodeDetector
        const hasBarcodeDetector =
          typeof window !== "undefined" && "BarcodeDetector" in window;

        if (hasBarcodeDetector) {
          detectorRef.current = new BarcodeDetector({ formats: FORMATS });
        }

        setStatus("scanning");

        // 4. Scan loop
        const scan = async () => {
          if (cancelled || !streamRef.current) return;

          if (hasBarcodeDetector && detectorRef.current && video.readyState >= 2) {
            try {
              const results = await detectorRef.current.detect(video);
              if (results.length > 0 && !cancelled) {
                onDetected(results[0].rawValue);
                close();
                return;
              }
            } catch {
              // ignore frame errors
            }
          }

          rafRef.current = requestAnimationFrame(() =>
            setTimeout(scan, hasBarcodeDetector ? 150 : 200),
          );
        };

        scan();
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          const msg = (err as Error).message || "";
          if (msg.includes("Permission") || msg.includes("permission") || msg.includes("NotAllowed")) {
            setErrorMsg(t.scanner.permissionDenied);
          } else {
            setErrorMsg(msg || t.scanner.permissionDenied);
          }
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <span className="text-white font-semibold text-base">
          {t.scanner.title}
        </span>
        <button
          onClick={close}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Scan frame overlay */}
        {status === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="relative"
              style={{ width: 280, height: 180 }}
            >
              {/* Corner marks */}
              {[
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
              ].map((cls, i) => (
                <span
                  key={i}
                  className={`absolute w-8 h-8 border-yellow-400 ${cls}`}
                />
              ))}
              {/* Scan line animation */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-yellow-400 opacity-80"
                style={{
                  animation: "scan-line 2s linear infinite",
                  top: "50%",
                }}
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 px-8">
            <p className="text-red-400 text-center text-sm">{errorMsg}</p>
            <button
              onClick={close}
              className="px-6 py-2 rounded-lg text-white text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {t.scanner.cancel}
            </button>
          </div>
        )}
      </div>

      {/* Hint */}
      {status === "scanning" && (
        <div
          className="px-4 py-3 text-center flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <p className="text-white/70 text-sm">{t.scanner.hint}</p>
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-80px); }
          50% { transform: translateY(80px); }
          100% { transform: translateY(-80px); }
        }
      `}</style>
    </div>
  );
}
