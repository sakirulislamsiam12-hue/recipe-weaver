import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";

import { NeuButton, NeuCard, NeuInput } from "./neu";
import { useLang } from "@/lib/i18n";
import {
  householdAvoids,
  householdServings,
  loadHousehold,
  saveHousehold,
  type Household,
  type Member,
} from "@/lib/premium-store";

const APPETITES: Member["appetite"][] = ["small", "regular", "big"];
const AVOID_TAGS = ["Vegetarian", "Vegan", "Dairy allergy", "Nut allergy", "No beef", "No pork", "Low spice"];

const APPETITE_LABEL: Record<Member["appetite"], { bn: string; en: string }> = {
  small: { bn: "কম", en: "Small" },
  regular: { bn: "সাধারণ", en: "Regular" },
  big: { bn: "বেশি", en: "Big" },
};

/** 13. Family / household profiles — shared pantry, per-member dietary overlays. */
export function FamilyProfiles() {
  const { t, lang } = useLang();
  const [house, setHouse] = useState<Household | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setHouse(loadHousehold());
  }, []);

  if (!house) return null;

  const update = (next: Household) => {
    setHouse(next);
    saveHousehold(next);
  };

  const addMember = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const member: Member = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      appetite: "regular",
      ageGroup: "adult",
      avoids: [],
    };
    update({ ...house, members: [...house.members, member] });
    setName("");
  };

  const patch = (id: string, fields: Partial<Member>) =>
    update({
      ...house,
      members: house.members.map((m) => (m.id === id ? { ...m, ...fields } : m)),
    });

  const toggleAvoid = (m: Member, tag: string) =>
    patch(m.id, {
      avoids: m.avoids.includes(tag) ? m.avoids.filter((a) => a !== tag) : [...m.avoids, tag],
    });

  const avoids = householdAvoids(house);

  return (
    <NeuCard className="mt-4">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Users className="h-4 w-4 text-accent" /> {t("family")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("familyHint")}</p>

      <div className="mt-3 flex gap-2">
        <NeuInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMember()}
          placeholder={t("memberName")}
          className="flex-1"
        />
        <NeuButton size="sm" onClick={addMember} aria-label={t("addMember")}>
          <Plus className="h-4 w-4" />
        </NeuButton>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {house.members.map((m) => (
          <li key={m.id} className="neu-inset rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{m.name}</span>
              <button
                onClick={() =>
                  patch(m.id, { ageGroup: m.ageGroup === "adult" ? "child" : "adult" })
                }
                className="neu-raised neu-press rounded-xl px-2 py-1 text-[10px]"
              >
                {m.ageGroup === "adult"
                  ? lang === "bn"
                    ? "বড়"
                    : "Adult"
                  : lang === "bn"
                    ? "শিশু"
                    : "Child"}
              </button>
              <button
                onClick={() =>
                  update({ ...house, members: house.members.filter((x) => x.id !== m.id) })
                }
                aria-label={`remove ${m.name}`}
                className="ml-auto text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {APPETITES.map((a) => (
                <button
                  key={a}
                  onClick={() => patch(m.id, { appetite: a })}
                  className={`rounded-xl px-2.5 py-1 text-[11px] ${
                    m.appetite === a ? "neu-raised-accent bg-accent text-accent-foreground" : "neu-raised"
                  }`}
                >
                  {lang === "bn" ? APPETITE_LABEL[a].bn : APPETITE_LABEL[a].en}
                </button>
              ))}
            </div>

            <p className="mt-2 text-[10px] font-semibold text-muted-foreground">{t("avoids")}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {AVOID_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleAvoid(m, tag)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] ${
                    m.avoids.includes(tag) ? "neu-inset text-accent" : "neu-raised text-muted-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <button
          onClick={() => update({ ...house, sharedPantry: !house.sharedPantry })}
          className={`rounded-lg px-3 py-2 ${house.sharedPantry ? "neu-inset text-accent" : "neu-raised text-muted-foreground"}`}
        >
          {lang === "bn" ? "যৌথ প্যান্ট্রি" : "Shared pantry"}
        </button>
        <span className="text-muted-foreground">
          {householdServings(house)} {t("perServing")}
        </span>
      </div>

      {avoids.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("avoids")}: {avoids.join(", ")}
        </p>
      )}
    </NeuCard>
  );
}
