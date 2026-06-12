"use client";

import { useState } from "react";
import { CrestEditor } from "@/components/bracket/CrestEditor";
import { CrestShield } from "@/components/bracket/CrestShield";
import { useCrestContext } from "@/components/bracket/CrestContext";
import { idString } from "@/components/bracket/utils";
import { useLocale } from "@/components/ui/LocaleProvider";
import { resolveCrest } from "@/lib/crest";
import { normalizeName } from "@/lib/stats";

interface TeamCrestProps {
  /**
   * Override whether this crest can open the editor. Defaults to the provider's
   * editable setting, but read-only locations (the tournament bracket) can force
   * display-only while the stats table stays editable.
   */
  editable?: boolean;
  size?: number;
  /** Identify the team by id, or by name (e.g. stats-table rows). */
  teamId?: { toString(): string } | string | null | undefined;
  teamName?: string | null;
}

/**
 * Heraldic shield shown next to a team name in the stats table. Renders nothing
 * unless the surrounding tournament uses the knight theme (provided via
 * {@link CrestProvider}). When the provider is editable (admin manage view) it
 * becomes a click target that opens the crest editor.
 */
export function TeamCrest({
  editable,
  size = 20,
  teamId,
  teamName,
}: TeamCrestProps) {
  const context = useCrestContext();
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);

  if (!context || !context.active) {
    return null;
  }

  const team = teamId
    ? context.teamsById.get(idString(teamId))
    : teamName
      ? context.teamsByName.get(normalizeName(teamName))
      : undefined;

  if (!team) {
    return null;
  }

  const crest = resolveCrest(idString(team._id), team.crest);
  const shield = (
    <CrestShield crest={crest} size={size} title={t("coatOfArms")} />
  );

  if (!(editable ?? context.editable)) {
    return <span className="mr-1.5 inline-flex shrink-0 align-middle">{shield}</span>;
  }

  // A `role="button"` span (rather than a real <button>) so it can safely nest
  // inside the clickable team rows/buttons used by the bracket and event views.
  function openEditor(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    setIsEditing(true);
  }

  return (
    <>
      <span
        aria-label={t("editCoatOfArms")}
        className="mr-1.5 inline-flex shrink-0 cursor-pointer rounded align-middle transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        onClick={openEditor}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openEditor(event);
          }
        }}
        role="button"
        tabIndex={0}
        title={t("editCoatOfArms")}
      >
        {shield}
      </span>
      {isEditing ? (
        <CrestEditor
          initialCrest={crest}
          onClose={() => setIsEditing(false)}
          onSaved={context.onCrestUpdated}
          teamId={idString(team._id)}
          teamName={team.name}
          tournamentId={context.tournamentId}
        />
      ) : null}
    </>
  );
}
