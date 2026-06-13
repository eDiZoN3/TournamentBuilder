# Future Issues / Improvements

## Event Tournaments: aktive Matches umbenennen und kommende Spiele vorhersagen

**Status:** geplant, noch nicht implementiert  
**Priorität:** hoch / nächster Event-Tournament-UX-Schritt

### Ziel

Im Event-Tournament-View sollen die aktuell spielbaren Matches klarer benannt werden und zusätzlich sollen die wahrscheinlich nächsten Matches danach angezeigt werden. Dadurch sieht man nicht nur, was gerade live/als nächstes gespielt wird, sondern auch ungefähr, welche Teams danach drankommen könnten.

### Aktuelles Verhalten

- Die App zeigt aktuell die berechneten spielbaren Event-Matches als "aktive Matches" bzw. sinngemäß als aktuell verfügbare Spiele.
- Diese Liste enthält nur Matches, die bereits beide Teams gesetzt haben und direkt gespielt werden können.
- Noch nicht spielbare Folgematches werden nicht angezeigt, obwohl sie im Turnierbaum bereits grob ableitbar sind.

### Gewünschtes Verhalten

1. **Bereich umbenennen**
   - "Aktive Matches" soll nicht mehr so heißen.
   - Besserer Name, z. B.:
     - "Jetzt spielbar"
     - "Aktuelle Spiele"
     - "Bereit zum Spielen"
   - Ziel: verständlicher machen, dass diese Matches sofort gespielt werden können.

2. **Nächste berechnete Spiele zusätzlich anzeigen**
   - Unter oder neben den sofort spielbaren Matches soll ein weiterer Bereich entstehen.
   - Vorschlag für Titel:
     - "Danach mögliche Spiele"
     - "Voraussichtliche nächste Spiele"
     - "Als Nächstes möglich"
   - Dieser Bereich zeigt Matches, die im Baum als nächste Stufe folgen, aber noch von Ergebnissen abhängen.

3. **Vorhersage-Charakter klar machen**
   - Wenn ein Match noch nicht sicher feststeht, soll es als Vorschau erkennbar sein.
   - Beispielanzeige:
     - "Sieger aus Darts Runde 1 Match 1 vs Sieger aus Darts Runde 1 Match 2"
     - oder, wenn eine Seite schon feststeht: "Team A vs Sieger aus Quiz Runde 1 Match 3"
   - Keine falsche Sicherheit erzeugen: Es sind mögliche nächste Spiele, keine final feststehenden Spiele.

4. **Nur sinnvolle nächste Ebene anzeigen**
   - Nicht den gesamten restlichen Turnierbaum als Liste anzeigen.
   - Nur die direkt nächsten Matches nach den aktuell spielbaren Matches.
   - Ziel: Planungshilfe, nicht Überladung.

### Akzeptanzkriterien

- Der bisherige Bereich "Aktive Matches" ist umbenannt in eine klarere Bezeichnung wie "Jetzt spielbar".
- Direkt darunter gibt es einen neuen Bereich für voraussichtliche nächste Matches.
- Die Vorschau zeigt nur Matches, die aus den aktuell spielbaren Matches entstehen können oder als nächste Runde relevant werden.
- Wenn beide Teams noch nicht feststehen, werden Platzhalter wie "Sieger aus ..." angezeigt.
- Wenn ein Team schon feststeht, wird dieses Team direkt angezeigt und nur die offene Seite als Platzhalter dargestellt.
- Die Anzeige aktualisiert sich nach Ergebniseingabe automatisch mit dem bestehenden State/API-Flow.
- Bestehende Event-Freilos-Logik bleibt unverändert:
  - Freilose zählen weiterhin direkt als Sieg.
  - Freilos-Gewinner können bereits als feststehende Seite in Vorschau-Matches erscheinen.
- Bestehende Match-Auswahl und Gewinner-Buttons bleiben unverändert funktionsfähig.

### Technischer Plan

#### 1. Bestehende Anzeige finden

Voraussichtlich relevante Dateien:

- `components/EventTournamentView.tsx`
- eventuell Event-spezifische Unterkomponenten im `components/`-Ordner
- Tests:
  - `__tests__/components/EventTournamentView.test.tsx`
  - `__tests__/components/EventBracketClick.test.tsx`
  - ggf. `__tests__/lib/eventTournament.test.ts`

Aufgabe:

- Stelle fest, wo der Text/Abschnitt für aktuell spielbare Matches gerendert wird.
- Prüfe, ob der Text über `lib/i18n.ts` kommt oder direkt im Component steht.

#### 2. Label umbenennen

Mögliche neue Benennung:

- Deutsch: `Jetzt spielbar`
- Englisch: `Ready to play`

Falls i18n genutzt wird:

- `lib/i18n.ts` um neuen/angepassten Key erweitern.
- Bestehende Tests für Localization ggf. aktualisieren.

#### 3. Vorschau-Daten berechnen

Neue Helper-Funktion bevorzugt in `lib/eventTournament.ts`, damit UI schlank bleibt.

Möglicher Name:

```ts
export function planUpcomingEventMatches(matches: IMatch[]): UpcomingEventMatchPreview[]
```

Möglicher Typ:

```ts
export interface UpcomingEventMatchPreview {
  matchId: string;
  disciplineIndex: number | null;
  disciplineName: string | null;
  round: number;
  position: number;
  label: string;
  teamA: ITeamSlot | null;
  teamB: ITeamSlot | null;
  pendingSourceA: string | null;
  pendingSourceB: string | null;
}
```

Logik:

- Ausgangspunkt sind aktuell spielbare Matches:
  - `status === "ready"`
  - nicht `isBye`
  - `teamA` und `teamB` vorhanden
  - noch kein `winnerId`
- Für diese Matches die `winnerNextMatchId` verfolgen.
- Die Zielmatches sammeln.
- Nur direkte Zielmatches anzeigen, nicht alle späteren Runden.
- Doppelte Zielmatches deduplizieren.
- Für jede Seite im Zielmatch:
  - Wenn `teamA`/`teamB` bereits gesetzt ist: Team anzeigen.
  - Wenn noch offen: Quelle über vorheriges Match beschreiben, z. B. "Sieger aus Darts Round 1 Match 2".

#### 4. UI-Anzeige bauen

In `components/EventTournamentView.tsx`:

- Bestehenden Bereich für jetzt spielbare Matches umbenennen.
- Neuen Abschnitt darunter ergänzen.
- Anzeigen:
  - Disziplinname
  - Runde/Matchlabel
  - Seite A vs Seite B
  - Offene Seiten als "Sieger aus ..."
- Keine Winner-Buttons in der Vorschau anzeigen.
- Vorschau klar optisch absetzen, z. B. kleiner/sekundärer Text.

#### 5. Tests nach TDD ergänzen

Neue/angepasste Tests:

1. **Label-Test**
   - Rendert EventTournamentView.
   - Erwartet neuen Titel `Jetzt spielbar` bzw. englischen Key.
   - Erwartet alten Text nicht mehr, falls eindeutig testbar.

2. **Upcoming-Preview-Test**
   - Erzeuge Event-Tournament mit mehreren Runden.
   - Stelle sicher, dass aktuell spielbare Matches angezeigt werden.
   - Stelle sicher, dass darunter direkte Folgematches als Vorschau erscheinen.
   - Erwartung: Platzhalter wie `Sieger aus ...` erscheinen, wenn Gewinner noch offen sind.

3. **Teilweise feststehende Vorschau**
   - Szenario mit Freilos oder bereits abgeschlossenem Match.
   - Erwartung: feststehendes Team wird direkt angezeigt, offene Seite bleibt Platzhalter.

4. **Keine Überladung**
   - Sicherstellen, dass nur direkt nächste Matches angezeigt werden, nicht spätere Finals/Runden, die noch nicht direkt relevant sind.

#### 6. Verifikation

Vor Merge/Deploy mindestens ausführen:

```bash
npm test -- --run __tests__/components/EventTournamentView.test.tsx __tests__/components/EventBracketClick.test.tsx __tests__/lib/eventTournament.test.ts
npm run typecheck
npm run lint
npm run build
```

Vor produktivem Deploy zusätzlich:

```bash
npm test
```

### Offene UX-Entscheidungen vor Implementierung

- Finale deutsche Bezeichnung für den aktuellen Bereich:
  - Empfehlung: `Jetzt spielbar`
- Finale deutsche Bezeichnung für Vorschau:
  - Empfehlung: `Voraussichtliche nächste Spiele`
- Soll die Vorschau pro Disziplin gruppiert werden oder als globale Liste erscheinen?
  - Empfehlung: globale Liste passend zur aktuellen Spielplanung, aber mit Disziplin-Badge.
- Sollen Vorschau-Matches klickbar sein?
  - Empfehlung: Nein, erstmal reine Anzeige. Klicks nur bei wirklich spielbaren Matches.

### Nicht Teil dieses Issues

- Keine Änderung an der Freilos-Verteilung.
- Keine Änderung an der Punkte-/Stats-Berechnung.
- Keine Änderung an Gewinnerauswahl oder Match-Completion-API.
- Keine automatische Court-Zuweisung für Vorschau-Matches.

---

## Event Tournaments: optimierter Bracket-Algorithmus statt reiner Zufall

**Status:** geplant, noch nicht implementiert  
**Priorität:** mittel/hoch, nach der Upcoming-Matches-Vorschau

### Ziel

Die Team-Zuordnung in Event-Tournament-Disziplinbäume soll nicht rein zufällig passieren. Stattdessen soll die App mehrere mögliche Auslosungen/Bracket-Layouts erzeugen, diese algorithmisch bewerten und das fairste Layout auswählen. Ziel ist, gleiche Matchups über den gesamten Event-Tournament-Graphen so weit wie möglich zu minimieren, ohne die Auslosung komplett starr wirken zu lassen.

### Entscheidung

Nicht auf reine Zufallsverteilung und Normalverteilung hoffen.

Stattdessen:

> **Randomized optimized draw**: viele zufällige Kandidaten erzeugen, jeden Kandidaten mit einem Fairness-/Wiederholungs-Score bewerten, den besten Kandidaten wählen. Bei Gleichstand entscheidet Zufall.

### Warum nicht rein zufällig?

- Bei kleinen Teilnehmerfeldern reichen wenige Disziplinen aus, damit zufällig viele gleiche Begegnungen entstehen.
- Zufall kann unfair wirken, auch wenn er technisch zufällig ist.
- Bei 5–8 Teams gibt es zu wenige Matches, damit sich Zufall über Normalverteilung sauber ausgleicht.
- Spieler nehmen wiederholte frühe Duelle stärker als unfair wahr als algorithmisch optimierte Paarungen.

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
+60: gleiches mögliches Match schon wieder in Runde 2
+40: zwei Teams landen erneut in derselben Baumhälfte
+25: Team landet erneut in exakt derselben Bracket-Position
+20: Top-Seed bekommt erneut denselben Pfad
+10: gleiche Freilos-/Nicht-Freilos-Nachbarschaft wie vorher
-5: gute Seed-Verteilung über verschiedene Baumhälften
```

Die genauen Werte können beim Implementieren angepasst werden. Wichtig ist die Priorität:

1. Direkte Match-Wiederholungen am stärksten vermeiden.
2. Potenzielle frühe Wiederholungen vermeiden.
3. Baumhälften und Positionen rotieren.
4. Seed-Fairness beibehalten.

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
  seedPositions: Map<number, Map<number, number>>;
}
```

#### 3. Historie über Disziplinen pflegen

Beim Erzeugen der Disziplinen wird eine Historie aufgebaut:

- Welche direkten Paarungen gab es bereits?
- Welche Teams waren schon in derselben Hälfte?
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

#### Test 3: rotiert Baumhälften

Szenario:

- 8 oder 16 Teams
- mehrere Disziplinen

Erwartung:

- Seed 1 ist nicht in jeder Disziplin mit denselben Seeds in derselben Hälfte.
- Seed 2/3/4 rotieren ebenfalls über unterschiedliche Pfade.

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

