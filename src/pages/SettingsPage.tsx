import { useEffect, useRef, useState } from "react";
import { Languages, Coins, Palette, Download, Upload, Store, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import {
  getAllProducts,
  getAllSales,
  getDB,
  saveProduct,
  saveSale,
  getSetting,
  setSetting,
  type Product,
  type Sale,
} from "@/lib/db";
import { toast } from "sonner";
import type { Lang } from "@/i18n/translations";
import type { Currency } from "@/lib/db";

const SETTINGS_KEYS = [
  "storeName",
  "storePhone",
  "storeAddress",
  "lang",
  "theme",
  "currency",
  "exchangeRate",
] as const;

export function SettingsPage() {
  const {
    t,
    lang,
    setLang,
    theme,
    setTheme,
    currency,
    setCurrency,
    exchangeRate,
    setExchangeRate,
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    (async () => {
      setStoreName((await getSetting<string>("storeName")) || "");
      setStorePhone((await getSetting<string>("storePhone")) || "");
      setStoreAddress((await getSetting<string>("storeAddress")) || "");
    })();
  }, []);

  const saveStore = async (
    key: "storeName" | "storePhone" | "storeAddress",
    value: string,
  ) => {
    await setSetting(key, value);
  };

  const handleSaveStore = async () => {
    await Promise.all([
      setSetting("storeName", storeName),
      setSetting("storePhone", storePhone),
      setSetting("storeAddress", storeAddress),
    ]);
    toast.success(t.settings.saved);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [products, sales] = await Promise.all([getAllProducts(), getAllSales()]);

      const settingsData: Record<string, unknown> = {};
      for (const key of SETTINGS_KEYS) {
        settingsData[key] = await getSetting(key);
      }

      const data = {
        version: 3,
        exportedAt: new Date().toISOString(),
        products,
        sales,
        settings: settingsData,
      };

      const filename = `clowthex-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });

      const shareFile = new File([blob], filename, { type: "application/json" });
      const canUseShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [shareFile] });

      if (canUseShare) {
        try {
          await navigator.share({
            files: [shareFile],
            title: "ClowtheX Backup",
          });
          toast.success(t.settings.imported.replace("الاستيراد", "التصدير") || "تم التصدير");
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t.settings.saved);
    } catch {
      toast.error(t.settings.importError);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.products)) throw new Error("invalid");

      const db = await getDB();
      const tx = db.transaction(["products", "sales"], "readwrite");
      await tx.objectStore("products").clear();
      if (db.objectStoreNames.contains("sales")) {
        await tx.objectStore("sales").clear();
      }
      await tx.done;

      for (const p of data.products as Product[]) {
        await saveProduct(p);
      }

      if (Array.isArray(data.sales)) {
        const db2 = await getDB();
        for (const s of data.sales as Sale[]) {
          await db2.put("sales", s);
        }
      }

      if (data.settings && typeof data.settings === "object") {
        for (const [key, value] of Object.entries(
          data.settings as Record<string, unknown>,
        )) {
          if (value !== undefined && value !== null) {
            await setSetting(key, value);
          }
        }
      }

      toast.success(t.settings.imported);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast.error(t.settings.importError);
    } finally {
      e.target.value = "";
      setIsImporting(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5">
      <h2 className="text-xl font-bold">{t.settings.title}</h2>

      <Section icon={<Languages className="w-4 h-4" />}>
        <div>
          <Label className="text-xs">{t.settings.language}</Label>
          <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section icon={<Coins className="w-4 h-4" />}>
        <div>
          <Label className="text-xs">{t.settings.currency}</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as Currency)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DZD">DZD — د.ج</SelectItem>
              <SelectItem value="EUR">EUR — €</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">{t.settings.exchangeRate}</Label>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={exchangeRate}
            onChange={(e) =>
              setExchangeRate(Math.max(0, Number(e.target.value) || 0))
            }
            className="mt-1"
          />
        </div>
      </Section>

      <Section icon={<Palette className="w-4 h-4" />}>
        <div>
          <Label className="text-xs">{t.settings.theme}</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button
              variant={theme === "light" ? "gold" : "outline"}
              onClick={() => setTheme("light")}
              size="sm"
            >
              {t.settings.themeLight}
            </Button>
            <Button
              variant={theme === "dark" ? "gold" : "outline"}
              onClick={() => setTheme("dark")}
              size="sm"
            >
              {t.settings.themeDark}
            </Button>
          </div>
        </div>
      </Section>

      <Section icon={<Store className="w-4 h-4" />} title={t.settings.store}>
        <div>
          <Label className="text-xs">{t.settings.storeName}</Label>
          <Input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            onBlur={() => saveStore("storeName", storeName)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t.settings.storePhone}</Label>
          <Input
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            onBlur={() => saveStore("storePhone", storePhone)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">{t.settings.storeAddress}</Label>
          <Input
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            onBlur={() => saveStore("storeAddress", storeAddress)}
            className="mt-1"
          />
        </div>
        <Button variant="gold" className="w-full" onClick={handleSaveStore}>
          <Save className="w-4 h-4" />
          {t.form.save}
        </Button>
      </Section>

      <Section icon={<Download className="w-4 h-4" />} title={t.settings.backup}>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "..." : t.settings.export}
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? "..." : t.settings.import}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {lang === "ar"
            ? "يشمل النسخ الاحتياطي المنتجات والمبيعات والإعدادات"
            : lang === "fr"
            ? "La sauvegarde inclut produits, ventes et paramètres"
            : "Backup includes products, sales and settings"}
        </p>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-elegant space-y-3">
      <div className="flex items-center gap-2 text-gold">
        <span className="w-7 h-7 rounded-md bg-gold/15 grid place-items-center">
          {icon}
        </span>
        {title && <span className="text-sm font-semibold">{title}</span>}
      </div>
      {children}
    </div>
  );
}
