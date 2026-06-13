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
