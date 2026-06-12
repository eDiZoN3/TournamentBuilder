"use client";

import { useState } from "react";
import { CrestShield } from "@/components/bracket/CrestShield";
import { useLocale } from "@/components/ui/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { formatTranslation } from "@/lib/i18n";
import {
  CREST_CHARGES,
  CREST_COLORS,
  CREST_DIVISIONS,
  type TeamCrest,
} from "@/lib/crest";

interface CrestEditorProps {
  initialCrest: TeamCrest;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  teamId: string;
  teamName: string;
  tournamentId: string;
}

function ColorRow({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (colorId: string) => void;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CREST_COLORS.map((color) => (
          <button
            aria-label={color.id}
            aria-pressed={value === color.id}
            className={`h-7 w-7 rounded-full border transition ${
              value === color.id
                ? "border-slate-900 ring-2 ring-slate-900 ring-offset-1 dark:border-white dark:ring-white"
                : "border-slate-300 dark:border-slate-600"
            }`}
            key={color.id}
            onClick={() => onChange(color.id)}
            style={{ backgroundColor: color.hex }}
            title={color.id}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export function CrestEditor({
  initialCrest,
  onClose,
  onSaved,
  teamId,
  teamName,
  tournamentId,
}: CrestEditorProps) {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [crest, setCrest] = useState<TeamCrest>(initialCrest);
  const [isSaving, setIsSaving] = useState(false);

  function update(patch: Partial<TeamCrest>) {
    setCrest((current) => ({ ...current, ...patch }));
  }

  function randomize() {
    const pick = <T,>(items: readonly T[]) =>
      items[Math.floor(Math.random() * items.length)];

    update({
      field: pick(CREST_COLORS).id,
      division: pick(CREST_DIVISIONS),
      divisionColor: pick(CREST_COLORS).id,
      charge: pick(CREST_CHARGES.slice(1)),
      chargeColor: pick(CREST_COLORS).id,
    });
  }

  async function save() {
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/teams/${teamId}/crest`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(crest),
        },
      );

      if (!response.ok) {
        throw new Error("request failed");
      }

      await onSaved();
      showToast({ title: t("themeUpdated"), type: "success" });
      onClose();
    } catch {
      showToast({
        message: t("unableToUpdateCrest"),
        title: t("unableToUpdateCrest"),
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      aria-label={formatTranslation(locale, "coatOfArmsFor", { name: teamName })}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("editCoatOfArms")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{teamName}</p>
          </div>
          <CrestShield crest={crest} size={64} />
        </div>

        <div className="mt-5 space-y-4">
          <ColorRow
            label={t("crestField")}
            onChange={(field) => update({ field })}
            value={crest.field}
          />

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {t("crestPattern")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CREST_DIVISIONS.map((division) => (
                <button
                  aria-label={division}
                  aria-pressed={crest.division === division}
                  className={`rounded-md border p-1 transition ${
                    crest.division === division
                      ? "border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                  key={division}
                  onClick={() => update({ division })}
                  title={division}
                  type="button"
                >
                  <CrestShield
                    crest={{ ...crest, division, charge: "none" }}
                    size={26}
                  />
                </button>
              ))}
            </div>
          </div>

          <ColorRow
            label={t("crestPatternColor")}
            onChange={(divisionColor) => update({ divisionColor })}
            value={crest.divisionColor}
          />

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {t("crestSymbol")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CREST_CHARGES.map((charge) => (
                <button
                  aria-label={charge}
                  aria-pressed={crest.charge === charge}
                  className={`rounded-md border p-1 transition ${
                    crest.charge === charge
                      ? "border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                  key={charge}
                  onClick={() => update({ charge })}
                  title={charge}
                  type="button"
                >
                  <CrestShield crest={{ ...crest, charge }} size={26} />
                </button>
              ))}
            </div>
          </div>

          <ColorRow
            label={t("crestSymbolColor")}
            onChange={(chargeColor) => update({ chargeColor })}
            value={crest.chargeColor}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={randomize}
            type="button"
          >
            {t("crestRandomize")}
          </button>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onClose}
              type="button"
            >
              {t("cancel")}
            </button>
            <button
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
              disabled={isSaving}
              onClick={() => void save()}
              type="button"
            >
              {isSaving ? t("saving") : t("crestSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
