import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shirt, KeyRound, Loader2, QrCode, CheckCircle2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import activationQr from "@/assets/activation-qr.png";

const ACTIVATION_CODE = "haythemgroupBdf(16062002)";

interface Props {
  onActivated: () => void;
}

type Step = "qr" | "password";

export function ActivationScreen({ onActivated }: Props) {
  const { t } = useApp();
  const [step, setStep] = useState<Step>("qr");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const handleScanned = (decoded: string) => {
    setScanOpen(false);
    if (decoded.trim() === ACTIVATION_CODE) {
      toast.success(t.activation.qrVerified);
      setStep("password");
    } else {
      toast.error(t.activation.qrInvalid);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    if (password.trim() === ACTIVATION_CODE) {
      localStorage.setItem("ssm_activated", "1");
      toast.success(t.activation.success);
      onActivated();
    } else {
      toast.error(t.activation.invalid);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-luxe p-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-card/95 backdrop-blur border border-gold/20 rounded-2xl p-8 shadow-gold">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold"
          >
            <Shirt className="w-10 h-10 text-gold-foreground" />
          </motion.div>

          <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
            {t.appName}
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-6">
            {t.activation.subtitle}
          </p>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${step === "qr" ? "text-gold" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step === "qr" ? "border-gold bg-gold/10" : "border-gold/40 bg-gold/5"}`}>
                {step === "password" ? <CheckCircle2 className="w-4 h-4 text-gold" /> : "1"}
              </div>
            </div>
            <div className="w-10 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === "password" ? "text-gold" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step === "password" ? "border-gold bg-gold/10" : "border-border"}`}>
                2
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "qr" ? (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <p className="text-sm text-center font-medium text-foreground">
                  {t.activation.step1}
                </p>
                <div className="flex justify-center">
                  <div className="p-3 rounded-xl bg-white border border-gold/30 shadow-gold">
                    <img
                      src={activationQr}
                      alt="Activation QR"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {t.activation.scanHint}
                </p>
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={() => setScanOpen(true)}
                >
                  <QrCode className="w-4 h-4" />
                  {t.activation.startScan}
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="pw"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={submitPassword}
                className="space-y-4"
              >
                <p className="text-sm text-center font-medium text-foreground">
                  {t.activation.step2}
                </p>
                <div className="relative">
                  <KeyRound className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.activation.passwordPlaceholder}
                    className="ps-10 h-12 bg-background/50"
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={loading || !password.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t.activation.button
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setPassword("");
                    setStep("qr");
                  }}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.activation.back}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © Haythem Group
        </p>
      </motion.div>

      <BarcodeScanner
        open={scanOpen}
        onOpenChange={setScanOpen}
        onDetected={handleScanned}
      />
    </div>
  );
}