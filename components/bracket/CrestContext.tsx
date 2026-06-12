"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ITeam } from "@/lib/models/Tournament";
import { idString } from "@/components/bracket/utils";
import { normalizeName } from "@/lib/stats";

interface CrestContextValue {
  /** Crests are only shown for the knight theme. */
  active: boolean;
  /** Whether crests can be edited (admin manage view only). */
  editable: boolean;
  teamsById: Map<string, ITeam>;
  /** Teams keyed by normalised name — stats rows only carry the team name. */
  teamsByName: Map<string, ITeam>;
  tournamentId: string;
  onCrestUpdated: () => void | Promise<void>;
}

const CrestContext = createContext<CrestContextValue | null>(null);

interface CrestProviderProps {
  active: boolean;
  children: ReactNode;
  editable?: boolean;
  onCrestUpdated?: () => void | Promise<void>;
  teams: ITeam[];
  tournamentId: string;
}

export function CrestProvider({
  active,
  children,
  editable = false,
  onCrestUpdated,
  teams,
  tournamentId,
}: CrestProviderProps) {
  const value = useMemo<CrestContextValue>(() => {
    const teamsById = new Map<string, ITeam>();
    const teamsByName = new Map<string, ITeam>();

    for (const team of teams) {
      teamsById.set(idString(team._id), team);
      teamsByName.set(normalizeName(team.name), team);
    }

    return {
      active,
      editable,
      teamsById,
      teamsByName,
      tournamentId,
      onCrestUpdated: onCrestUpdated ?? (() => {}),
    };
  }, [active, editable, onCrestUpdated, teams, tournamentId]);

  return <CrestContext.Provider value={value}>{children}</CrestContext.Provider>;
}

export function useCrestContext(): CrestContextValue | null {
  return useContext(CrestContext);
}
