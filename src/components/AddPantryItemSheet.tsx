import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useLang } from "@/lib/i18n";
import {
  GROCERY_ITEMS,
  STORAGE_LABELS,
  STORAGE_TYPES,
  getExpectedExpiryDate,
  getShelfLifeDays,
  toISODate,
  type StorageType,
} from "@/lib/expiry-db";
import { UNITS, USAGE_OPTIONS, type NewPurchase, type Unit } from "@/lib/pantry-purchases";

const FIELD =
  "min-h-[44px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (purchase: NewPurchase) => void;
};

export function AddPantryItemSheet({ open, onClose, onSubmit }: Props) {
  const { bi: lang } = useLang();
  const bn = lang === "bn";
  const today = toISODate(new Date());

  const [name, setName] = useState("");
  const [showList, setShowList] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("কেজি");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today);
  const [storage, setStorage] = useState<StorageType>("refrigerator");
  const [usage, setUsage] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    const pool = q
      ? GROCERY_ITEMS.filter(
          (i) => i.bn.includes(name.trim()) || i.en.toLowerCase().includes(q),
        )
      : GROCERY_ITEMS;
    return pool.slice(0, 30);
  }, [name]);

  const previewDays = name.trim() ? getShelfLifeDays(name, storage) : null;

  const reset = () => {
    setName("");
    setQuantity("1");
    setUnit("কেজি");
    setPrice("");
    setDate(toISODate(new Date()));
    setStorage("refrigerator");
    setUsage("");
    setShowList(false);
  };

  if (!open) return null;

  const submit = () => {
    const qty = Number(quantity);
    const cost = Number(price);
    const invalid =
      !name.trim() ||
      !Number.isFinite(qty) ||
      qty <= 0 ||
      !Number.isFinite(cost) ||
      cost <= 0 ||
      !date ||
      date > toISODate(new Date()) ||
      !storage;

    if (invalid) {
      haptic("warn");
      toast.error(bn ? "সঠিক মূল্য দিন" : "Please enter valid details", {
        className: "border-destructive bg-destructive text-destructive-foreground",
      });
      return;
    }

    onSubmit({
      user_id: "",
      item_name: name.trim(),
      quantity: qty,
      unit,
      purchase_price: cost,
      purchase_date: date,
      storage_type: storage,
      expected_usage: usage.trim() ? usage.trim() : null,
    });

    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-200 flex flex-col justify-end">
      <button aria-label="close" onClick={onClose} className="absolute inset-0 bg-foreground/40" />

      <div className="sheet-up relative mx-auto flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-xl border-t border-border bg-background px-4 pb-6 pt-4 md:mb-6 md:max-w-lg md:rounded-xl md:border">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">
            {bn ? "নতুন আইটেম যোগ করুন" : "Add pantry item"}
          </h2>
          <button
            onClick={onClose}
            aria-label={bn ? "বাতিল" : "Cancel"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* 1. item name with autocomplete */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {bn ? "আইটেমের নাম" : "Item name"} *
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowList(true);
                }}
                onFocus={() => setShowList(true)}
                placeholder={bn ? "যেমন: আলু, ডিম, মাছ" : "e.g. potato, egg, fish"}
                className={cn(FIELD, "pl-9")}
                autoComplete="off"
              />
            </div>
            {showList && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.bn}>
                    <button
                      type="button"
                      onClick={() => {
                        setName(s.bn);
                        setShowList(false);
                      }}
                      className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 text-left text-sm active:bg-muted"
                    >
                      <span>{s.bn}</span>
                      <span className="text-xs text-muted-foreground">{s.en}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 2 + 3. quantity and unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {bn ? "পরিমাণ" : "Quantity"} *
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {bn ? "একক" : "Unit"} *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className={FIELD}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. price */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {bn ? "ক্রয়মূল্য" : "Purchase price"} *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ৳
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="250"
                className={cn(FIELD, "pl-7")}
              />
            </div>
          </div>

          {/* 5. purchase date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {bn ? "কেনার তারিখ" : "Purchase date"} *
            </label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className={FIELD}
            />
          </div>

          {/* 6. storage type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              {bn ? "সংরক্ষণের ধরন" : "Storage type"} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STORAGE_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStorage(s)}
                  aria-pressed={storage === s}
                  className={cn(
                    "min-h-[44px] rounded-lg border px-3 text-sm transition-colors",
                    storage === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  {bn ? STORAGE_LABELS[s].bn : STORAGE_LABELS[s].en}
                </button>
              ))}
            </div>
          </div>

          {/* 7. expected usage (optional) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {bn ? "কবে ব্যবহার করবেন (ঐচ্ছিক)" : "Expected usage (optional)"}
            </label>
            <input
              list="sp-usage-options"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder={USAGE_OPTIONS[0]}
              className={FIELD}
            />
            <datalist id="sp-usage-options">
              {USAGE_OPTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          {previewDays !== null && (
            <p className="text-xs text-muted-foreground">
              {bn
                ? `আনুমানিক মেয়াদ: ${previewDays} দিন (${getExpectedExpiryDate(name, storage, date)})`
                : `Estimated shelf life: ${previewDays} days (${getExpectedExpiryDate(name, storage, date)})`}
            </p>
          )}
        </div>

        <button
          onClick={submit}
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground active:opacity-80"
        >
          <Plus className="h-4 w-4" />
          {bn ? "যোগ করুন" : "Add"}
        </button>
      </div>
    </div>
  );
}
