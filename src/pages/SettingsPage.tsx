import { useEffect, useRef, useState } from "react";
import { Languages, Coins, Palette, Store, Save, Download, Upload, DatabaseBackup } from "lucide-react";
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
import { getDB, getSetting, setSetting } from "@/lib/db";
import { toast } from "sonner";

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

  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const name = await getSetting("storeName");
        const phone = await getSetting("storePhone");
        const address = await getSetting("storeAddress");
        setStoreName(String(name || ""));
        setStorePhone(String(phone || ""));
        setStoreAddress(String(address || ""));
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const handleSaveStore = async () => {
    await setSetting("storeName", storeName);
    await setSetting("storePhone", storePhone);
    await setSetting("storeAddress", storeAddress);
    toast.success(t.settings.saved);
  };

  const handleExport = async () => {
    try {
      const db = await getDB();
      const products = await db.getAll("products");
      const sales = await db.getAll("sales");
      const settings = await db.getAll("settings");
      const backup = { products, sales, settings };
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clowthex-backup.json";
      a.click();
      toast.success("تم التصدير");
    } catch (e) {
      toast.error("خطأ في التصدير");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const db = await getDB();
        const tx = db.transaction(["products", "sales", "settings"], "readwrite");
        await tx.objectStore("products").clear();
        await tx.objectStore("sales").clear();
        await tx.objectStore("settings").clear();
        for (const p of data.products) await tx.objectStore("products").put(p);
        for (const s of data.sales) await tx.objectStore("sales").put(s);
        for (const st of data.settings) await tx.objectStore("settings").put(st);
        await tx.done;
        toast.success("تم الاستيراد");
        window.location.reload();
      } catch (e) {
        toast.error("ملف غير صالح");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">{t.settings.title}</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold"><Languages size={18}/> {t.settings.language}</div>
          <Select value={lang} onValueChange={(v: any) => setLang(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold"><Coins size={18}/> {t.settings.currency}</div>
          <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DZD">DZD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} />
        </div>

        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold"><Store size={18}/> {t.settings.store}</div>
          <Input placeholder={t.settings.storeName} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Input placeholder={t.settings.storePhone} value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
          <Input placeholder={t.settings.storeAddress} value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
          <Button className="w-full bg-yellow-600" onClick={handleSaveStore}>{t.form.save}</Button>
        </div>

        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold"><DatabaseBackup size={18}/> {t.settings.backup || "النسخ الاحتياطي"}</div>
          <input type="file" ref={importRef} className="hidden" onChange={handleImport} accept=".json" />
          <Button className="w-full bg-yellow-600" onClick={handleExport}><Download className="mr-2" size={16}/> {t.settings.export || "تصدير"}</Button>
          <Button variant="outline" className="w-full" onClick={() => importRef.current?.click()}><Upload className="mr-2" size={16}/> {t.settings.import || "استيراد"}</Button>
        </div>
      </div>
    </div>
  );
}
