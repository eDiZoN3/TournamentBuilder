# Future Issues / Improvements

## Event Tournaments: optimierter Bracket-Algorithmus statt reiner Zufall

**Status:** geplant, noch nicht implementiert  
**Priorität:** mittel/hoch, nach der Upcoming-Matches-Vorschau

### Ziel

Die Team-Zuordnung in Event-Tournament-Disziplinbäume soll nicht rein zufällig passieren. Stattdessen soll die App mehrere mögliche Auslosungen/Bracket-Layouts erzeugen, diese algorithmisch bewerten und das fairste Layout auswählen. Ziel ist, gleiche Matchups über den gesamten Event-Tournament-Graphen so weit wie möglich zu minimieren, ohne die Auslosung komplett starr wirken zu lassen.

Zusätzlich soll der Optimierer nicht nur die erste Runde betrachten: Auch in späteren Folge-Runden sollen bereits bekannte oder wahrscheinliche gleiche Matchups möglichst spät wieder möglich werden. Wenn zwei Teams schon früh gegeneinander gespielt haben oder in vorherigen Disziplinen früh aufeinandertreffen konnten, sollen sie in neuen Brackets nach Möglichkeit in unterschiedliche Baumhälften bzw. gegensätzliche Pfade gesetzt werden, sodass das frühestmögliche erneute Aufeinandertreffen erst im Halbfinale oder idealerweise erst im Finale liegt.

### Entscheidung

Nicht auf reine Zufallsverteilung und Normalverteilung hoffen.

Stattdessen:

> **Randomized optimized draw**: viele zufällige Kandidaten erzeugen, jeden Kandidaten mit einem Fairness-/Wiederholungs-Score bewerten, den besten Kandidaten wählen. Bei Gleichstand entscheidet Zufall.

### Warum nicht rein zufällig?

- Bei kleinen Teilnehmerfeldern reichen wenige Disziplinen aus, damit zufällig viele gleiche Begegnungen entstehen.
- Zufall kann unfair wirken, auch wenn er technisch zufällig ist.
- Bei 5–8 Teams gibt es zu wenige Matches, damit sich Zufall über Normalverteilung sauber ausgleicht.
- Spieler nehmen wiederholte frühe Duelle stärker als unfair wahr als algorithmisch optimierte Paarungen.
- Wiederholte Matchups wirken auch dann unfair, wenn sie nicht direkt in Runde 1 wieder passieren, sondern durch ähnliche Pfade schon in Runde 2 oder im Halbfinale sehr wahrscheinlich erneut entstehen.

### Harte Regeln / Constraints

Diese Regeln dürfen vom Optimierer nicht verletzt werden:

- Pro Disziplin muss der Bracket vollständig gültig sein.
- Die vorhandene Freilos-Verteilung bleibt erhalten:
  - obere Seeds bevorzugt
  - letzter Seed idealerweise 0, maximal 1 Freilos
  - pro Disziplin maximal ein Freilos pro Team
- Ein Team darf in einer Disziplin nur einmal im Bracket stehen.
- Winner-Routing und Match-Graph müssen weiterhin korrekt sein.
- Power-of-two Teilnehmerfelder ohne Freilose bleiben weiterhin ohne Freilose.
- Bestehende Event-Stats bleiben unverändert.

### Weiche Optimierungsziele

Der Algorithmus soll Kandidaten mit Strafpunkten bewerten. Niedrigster Score gewinnt.

Empfohlene Strafpunkte:

```txt
+100: gleiches direktes Round-1-Match wie in einer vorherigen Disziplin
+80: bereits bekanntes Matchup kann erneut vor dem Finale entstehen, obwohl Trennung bis Finale möglich wäre
+60: gleiches mögliches Match schon wieder in Runde 2
+45: bereits bekanntes Matchup kann erneut im Halbfinale entstehen, obwohl Finale möglich wäre
+40: zwei Teams landen erneut in derselben Baumhälfte
+25: Team landet erneut in exakt derselben Bracket-Position
+20: Top-Seed bekommt erneut denselben Pfad
+10: gleiche Freilos-/Nicht-Freilos-Nachbarschaft wie vorher
-5: gute Seed-Verteilung über verschiedene Baumhälften
```

Die genauen Werte können beim Implementieren angepasst werden. Wichtig ist die Priorität:

1. Direkte Match-Wiederholungen am stärksten vermeiden.
2. Potenzielle frühe Wiederholungen vermeiden.
3. Wiederholte Matchups, falls nicht vermeidbar, so weit wie möglich nach hinten schieben: Finale besser als Halbfinale, Halbfinale besser als Runde 2.
4. Baumhälften, Viertel/Pfade und Positionen rotieren.
5. Seed-Fairness beibehalten.

### Technischer Ansatz

#### 1. Kandidaten pro Disziplin erzeugen

Für jede Disziplin werden nicht nur ein Paarungsplan und ein Bracket-Layout erzeugt, sondern mehrere Kandidaten.

Mögliche Konstante:

```ts
const EVENT_DRAW_CANDIDATE_COUNT = 250;
```

Für jeden Kandidaten:

- Freilose für diese Disziplin gemäß bestehendem `byePlan` übernehmen.
- Aktive Seeds ohne Freilos bestimmen.
- First-Round-Paarungen generieren.
- Bracket-Positionen variieren/rotieren/shufflen.
- Vollständigen Kandidaten intern bewerten.

#### 2. Score-Funktion einführen

Bevorzugt in `lib/eventTournament.ts`.

Mögliche interne Funktion:

```ts
function scoreEventDrawCandidate(
  candidate: EventDrawCandidate,
  history: EventDrawHistory,
): number
```

Mögliche interne Typen:

```ts
interface EventDrawCandidate {
  entities: FirstRoundEntity[];
  pairs: Array<[number, number]>;
  byes: number[];
}

interface EventDrawHistory {
  directPairs: Map<string, number>;
  sameHalfPairs: Map<string, number>;
  earliestPossibleRoundByPair: Map<string, number>;
  seedPositions: Map<number, Map<number, number>>;
}
```

#### 3. Historie über Disziplinen pflegen

Beim Erzeugen der Disziplinen wird eine Historie aufgebaut:

- Welche direkten Paarungen gab es bereits?
- Welche Teams waren schon in derselben Hälfte?
- In welcher frühesten Runde konnten Teams in vorherigen Disziplinen aufeinandertreffen?
- Welche Bracket-Positionen hatte jeder Seed bereits?
- Welche Seeds hatten Freilose?

Nach Auswahl des besten Kandidaten wird diese Historie aktualisiert.

#### 4. Winner-Routing unverändert lassen

Wichtig: Der Optimierer soll nur entscheiden, **welche First-Round-Entities an welche Bracket-Position kommen**.

Nicht ändern:

- `connectWinner()`
- `routeWinner()`
- Match-Completion-API
- Stats-Logik

Damit bleibt das Risiko klein.

### Akzeptanzkriterien

- Die App erzeugt für jede Event-Disziplin weiterhin gültige Single-Elimination-Bäume.
- Gleiche Round-1-Paarungen treten nur noch auf, wenn sie mathematisch kaum vermeidbar sind.
- Bei Power-of-two Feldern mit genug möglichen Paarungen gibt es über mehrere Disziplinen keine wiederholten Round-1-Matches, solange vermeidbar.
- Teams rotieren über verschiedene Bracket-Positionen.
- Teams rotieren über verschiedene Baumhälften, soweit möglich.
- Bereits bekannte Matchups werden in neuen Brackets möglichst weit auseinander gesetzt, sodass ein erneutes Aufeinandertreffen — wenn möglich — erst im Finale stattfinden kann.
- Wenn Final-Trennung mathematisch nicht möglich ist, wird das frühestmögliche erneute Aufeinandertreffen mindestens so spät wie möglich gelegt, z. B. Halbfinale statt Runde 2.
- Freilos-Regeln bleiben exakt erhalten.
- Die Auslosung bleibt reproduzierbar über `drawSeed`.
- Bei gleichem `drawSeed` entsteht derselbe optimierte Graph.
- Bei anderem `drawSeed` können andere, aber weiterhin optimierte Graphen entstehen.

### TDD-Testplan

#### Test 1: optimiert direkte Wiederholungen bei 8 Teams / 4 Disziplinen

Datei:

- `__tests__/lib/eventTournament.test.ts`

Szenario:

- 8 Teams
- 4 Disziplinen
- keine Freilose

Erwartung:

- Keine direkte Round-1-Paarung kommt doppelt vor.
- Bracket-Signaturen pro Disziplin unterscheiden sich.

#### Test 2: minimiert unvermeidbare Wiederholungen bei 5 Teams / 4 Disziplinen

Szenario:

- 5 Teams
- 4 Disziplinen
- 3 Freilose pro Disziplin
- wenige echte Round-1-Matches, Wiederholungen teilweise unvermeidbar

Erwartung:

- Letzter Seed bleibt bei 0/max. 1 Freilos gemäß bestehender Regel.
- Direkte Paarungen gegen den letzten Seed werden verteilt.
- Keine Paarung wird häufiger wiederholt als nötig.

#### Test 3: rotiert Baumhälften und verschiebt Wiederholungen nach hinten

Szenario:

- 8 oder 16 Teams
- mehrere Disziplinen

Erwartung:

- Seed 1 ist nicht in jeder Disziplin mit denselben Seeds in derselben Hälfte.
- Seed 2/3/4 rotieren ebenfalls über unterschiedliche Pfade.
- Ein bekanntes Matchup aus einer früheren Disziplin wird in einer späteren Disziplin nicht wieder in denselben frühen Pfad gelegt, wenn eine Platzierung in gegenüberliegenden Baumhälften möglich ist.
- Für ein wiederholtes Matchup ist das frühestmögliche erneute Aufeinandertreffen nach Möglichkeit erst das Finale; andernfalls wird die späteste mathematisch mögliche Runde gewählt.

#### Test 4: Reproduzierbarkeit über Draw Seed

Szenario:

- Gleiche Teams, gleiche Disziplinen, gleicher `drawSeed` zweimal generieren.

Erwartung:

- Die Bracket-Signaturen sind identisch.

Dann:

- Anderer `drawSeed`.

Erwartung:

- Bracket-Signaturen dürfen abweichen, bleiben aber valide.

#### Test 5: bestehende Freilos- und Stats-Tests bleiben grün

Ausführen:

```bash
npm test -- --run __tests__/lib/eventTournament.test.ts __tests__/lib/stats.test.ts __tests__/components/EventStats.test.tsx
```

### Implementierungsplan

1. Bestehende `generateEventTournamentMatches()`-Logik in `lib/eventTournament.ts` analysieren.
2. Interne Typen für Kandidat und Historie ergänzen.
3. Tests für wiederholungsarme Paarungen schreiben und rot laufen lassen.
4. Kandidaten-Generator bauen, der bestehende Freilos-Pläne respektiert.
5. Score-Funktion für direkte Paarungen implementieren.
6. Score-Funktion um Baumhälften und Positionen erweitern.
7. Beste Kandidaten-Auswahl pro Disziplin einbauen.
8. Historie nach jeder Disziplin aktualisieren.
9. Bestehende `pairRoundOne()`-Logik entweder wiederverwenden oder in den Kandidaten-Generator integrieren.
10. Zieltests ausführen.
11. Full Test Suite ausführen.
12. Erst danach committen/deployen.

### Verifikation

Vor Commit mindestens:

```bash
npm test -- --run __tests__/lib/eventTournament.test.ts __tests__/lib/stats.test.ts __tests__/components/EventTournamentView.test.tsx __tests__/components/EventStats.test.tsx
npm run typecheck
npm run lint
npm run build
```

Vor Deploy zusätzlich:

```bash
npm test
```

### Nicht Teil dieses Issues

- Keine UI-Änderung.
- Keine Änderung an der Upcoming-Matches-Vorschau.
- Keine Änderung an Punkte-/Stats-Regeln.
- Keine Änderung an Admin-Setup-Formularen.
- Keine manuelle Seed-Bearbeitung.

### UX-Erklärung für später

Falls die App diese Logik später irgendwo erklären soll, könnte der Text lauten:

> Die Event-Auslosung wird zufällig erzeugt und anschließend optimiert, damit gleiche Begegnungen über mehrere Disziplinen möglichst selten vorkommen.



---
