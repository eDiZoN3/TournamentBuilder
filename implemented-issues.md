1. [implemented] selection of acive match should be automatic, but can be manually overriden
2. [implemented] when entering scores the card should not fade if not hovering over it and stay in vordergrund the whole time until entered or dismissed
3. [implemented] for visibility the lines from winner bracket to the lower bracket should not be here, just inside the winnerbracket and the looserbracket but not connecting the 2, this creates hard readability
4. [implemented] as a admin i need the option to delete tournaments
5. [implemented] once completed, a match needs still the possiblity of an admin to override the standing because it could happen the wrong team is accidentaly marked as winner and right now i dont have an option to revert this
6. [implemented] visible for everyone i want to have per tournament stats of every team/player (sum of games won, games played, point won, point lost, win rate etc.) and overall stats for indivual players or teams that are already in the database so cross season stats are available, this can be visible to everyone and should be calculated by system and not hand
7. [implemented] when in the admin view the desktop version is good and everything is visible, when there are more teams than probably 8 it will be nescessary to drop the looser bracket below the winnersbracket
8. [implemented] when just viewing the matchs with no admin the view is to narrow, it can expand the same way as in admin view
9. [implemented] already at 1400px width it should be that the lower bracket is below the winner bracket and in mobile view it really is very badly visible, the 2 tabs are a good solution but the graph needs to be refined to be better visible, i dont know maybe also with tabs that show round 1, round 2 etc and then this displays only those rounds
10. [implemented] stats table are not mobile (responsive design) compatible. that must be fixed, also admin view create accounts cards are to wide
11. [implemented] in mobile view the round tabs are all labeld final which is wrong. it should be round 1, round 2. etc.
12. [implemented] need burger menu navbar in mobile view
13. [implemented] super admin (created with runtime script) needs to be able to remove other admins, call admin not admin anymore but tournament lead or something (superadmin should still be called admin)
14. [implemented] when logging out from admin account, redirect to normal login page
15. [implemented] remove the seperation of the two login pages and automatically detect if its an admin account, a tournament manger account or a normal player account, this is better ux
16. [implemented] there is no logout button for player accounts, add this
17. [implemented] when a player presses join it is not instant visible in the create tournament view that he has joined, this shuold be possible
18. [implemented] admin needs feature to reset stats, per user, per tournament, per season, and complete, make a new tab in the dashboard for it.
19. [implemented] in the admin dashboard is no clickable link that leads back to public view, this needs to be added
20. [implemented] need to allow in team round robin to enter only playernames and generate the teams that are playing by random. can only work if the playercount is player % teamsize = 0, it of course then need to support self join from player accounts but starting the tournament is prohibited until the correct amount of players with the constriction before ist fullfilled. for round robin default is 1 set per match, but can be changed to bo3
21. [implemented] the matchtables active row is in manage view off (the active and completed rounds columns are less wide then every other round, should be the same size the whole table) and in the public view the active rows columns are not the same size as the non active rows, do not mark them like this but mark them with light green background as indicator this is the ongoing round, same is in admin view, the wideness of each column should be fixed size in % this way every coloumn should be the exact same wideness
22. [implemented] sign in card is off, should be on the same distanze from the navbar then the signup card
23. [implemented] if only one court is available i want the button mark as in progress mark it and do not show the assign court button, is uselss when only 1 court is available
24. [implemented] i want the trainingsmatches entered in a card and and the possibility to choose from other registered player and not anyone so that it get correctly matched to their statistics as well, if a tournament participant is already a registered player (either self joined or entered by manager) those stats need to be matched to this account as well. so in tournament creation there should be also the possibility to enter already registerd players. like you start entering the name and matching accounts are suggested as example.
25. [implemented] when creating a tournament i want the possibility to create it without having to enter already every participant but be able to start it with an extra button so i can create it. players join themselves or are entered. and therefore the tournament can be created ahead of time and then at given time when the manager starts it everyone has to be entered and then the tournament graph is drawn the teams created and so on and so forth. basically like i can create the tournament now and enter no one as player. then until the tournament is started by the manager self joined players are in, i can add one day a few poeple then the other day and when started the poeple in it are locked and no longer modified and then the matches are shown with point entering etc.
26. [implemented] when in point enter card it is pulsating the opacity of the card, remove that, it needs to be foreground with 100% opacity
27. [implemented] add translations for tournament graph where e.g. WB semi final should be Semi-Final in eng and Halbfinale in DE. same as 1st 2nd place shuold have a german translation to e.g. 1.-2. Platz.
28. [implemented] add a switch in tournament creation to check whether semi finale and final have bo3 or not.
29. [implemented] als laufend markieren in winner only tournaments must work so that i can select wich match is played right now.
30. [implemented] after change password redirect to the dashboard to be able to enter standings. and the dashboard button shuold display the management view for the tournament management and not change-password
33. [implemented] i dont want the active match to pulsate. just be highlighted with the yellow line like right now but no pulsating.
34. [implemented] make sure there is a meaningfull german translation everywhere in the frontend available

35. [implemented] Event Tournaments: aktive Matches umbenennen und kommende Spiele vorhersagen

## Event Tournaments: aktive Matches umbenennen und kommende Spiele vorhersagen

**Status:** implementiert  
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

**Implemented notes:**

- Current playable event matches are shown as the active/current matches section.
- Recalculated upcoming event matches are shown as a read-only preview.
- The recalculated preview can be collapsed/expanded to save space.
- Existing winner selection remains available only for current playable matches.
- Existing bye/stat behavior remains intact.

36. [implemented] Event Tournaments: greedy Berechnung der nächsten spielbaren Runden

## Event Tournaments: greedy Berechnung der nächsten spielbaren Runden

**Status:** implementiert  
**Priorität:** mittel/hoch, nach Disconnect-/Stale-Update-Schutz und vor weiterer UI-Politur

### Ziel

Die Anzeige und Berechnung der nächsten spielbaren Event-Matches soll nicht nur starr nach Slot/Runde/Position laufen. Stattdessen soll ein **greedy Scheduler** entscheiden, welche Matches als nächstes sinnvoll spielbar sind, sobald der Graph steht und Ergebnisse nach und nach eingetragen werden.

Ziel ist, die nächsten Runden möglichst früh und fair vorzubereiten, ohne falsche oder doppelte Ergebnisse durch parallele Admins, stale Clients oder unvollständige Abhängigkeiten zu riskieren.

### Entscheidung

Nicht alle Matches einfach rein nach `round` und `position` abarbeiten.
Stattdessen:

> **Greedy next-match scheduling**: Bei jedem Refresh/Update werden alle aktuell spielbaren Event-Matches bewertet. Der Scheduler wählt die besten nächsten Matches anhand von harten Bedingungen und weichen Prioritäten.

### Harte Regeln / Constraints

Diese Regeln dürfen nie verletzt werden:

- Ein Match ist nur spielbar, wenn beide Teilnehmer feststehen.
- Ein Match ist nur spielbar, wenn es nicht abgeschlossen ist.
- Ein Match mit Freilos darf nicht als manuell spielbares Match erscheinen.
- Ein Team darf nicht gleichzeitig in zwei offenen vorgeschlagenen Matches auftauchen.
- Gewinner-Routing aus vorherigen Matches muss abgeschlossen sein, bevor ein Folgematch vorgeschlagen wird.
- Stale/alte Clients dürfen durch den Scheduler keine bereits überholten Matches bestätigen können.
- Bestehende Ergebnis- und Stats-Regeln bleiben unverändert.
- Die Berechnung muss deterministisch sein: gleicher Turnierzustand ergibt gleiche Vorschlagsliste.

### Greedy-Prioritäten

Der Algorithmus soll pro Kandidaten-Match einen Score berechnen und die besten Matches auswählen.

Wichtig: Der Scheduler soll **auf die Gesamt-Laufzeit des Event-Turniers optimieren**, nicht strikt nach „Runde 1 komplett vor Runde 2 komplett vor Runde 3“ arbeiten. Runde/Reihenfolge ist nur ein Faktor im Score. Wenn ein Runde-2-Match den Gesamtfluss deutlich verbessert und alle Abhängigkeiten erfüllt sind, darf es vor noch offenen Runde-1-Matches anderer Disziplinen vorgeschlagen werden.

Empfohlene Priorität:

1. Matches, deren beide Vorgänger abgeschlossen sind, haben Vorrang.
2. Kürzere Gesamt-Laufzeit / besserer Turnierfluss hat Vorrang vor starrer Rundennummer-Reihenfolge.
3. Matches, die den nächsten Folgematch-Knoten freischalten, bekommen Bonus.
4. Disziplinen sollen möglichst gleichmäßig vorankommen.
5. Teams sollen nicht direkt nacheinander mehrfach vorgeschlagen werden, wenn Alternativen existieren.
6. Frühere Runden sind ein Tie-Breaker, aber kein hartes „Runde 1 vor Runde 2“-Gesetz.
7. Finals/Disziplinsieger-Matches sollen erst erscheinen, wenn keine niedrigeren abhängigen Matches derselben Disziplin offen sind.
8. Bei Gleichstand: stabile Sortierung nach Disziplin, Runde, Position, Match-ID.

Mögliche Score-Idee:

```txt
+1000: beide Teilnehmer bekannt und Match ready
+200: Match schaltet nach Abschluss ein weiteres Match frei
+100: Disziplin ist im Vergleich zu anderen im Rückstand
+50: niedrigere Runde
+20: Team hatte länger kein vorgeschlagenes Match
-500: Team ist bereits in einem anderen vorgeschlagenen Match enthalten
-100: Disziplin ist schon deutlich weiter als andere
```

Die Zahlen sind nur Startwerte. Wichtig ist die Reihenfolge der Ziele, nicht die exakte Gewichtung.

### Technischer Ansatz

#### 1. Bestehende Next-Slot-Logik analysieren

Relevante Dateien:

- `lib/eventTournament.ts`
- `components/event/EventTournamentView.tsx`
- `__tests__/lib/eventTournament.test.ts`
- `__tests__/components/EventTournamentView.test.tsx`

Aktuell relevante Funktion:

- `planEventSlots(tournament.matches)`

Diese Funktion soll entweder ersetzt oder intern auf den neuen greedy Scheduler umgestellt werden.

#### 2. Interne Kandidaten-Funktion einführen

Mögliche interne Funktion:

```ts
function getPlayableEventMatchCandidates(matches: IMatch[]): IMatch[]
```

Aufgabe:

- alle nicht abgeschlossenen Event-Matches sammeln
- nur Matches mit `teamA` und `teamB` behalten
- `isBye` ausschließen
- Status `ready`/spielbar beachten
- pro Match Metadaten für Score berechnen

#### 3. Greedy-Auswahl bauen

Mögliche Funktion:

```ts
function planGreedyEventSlots(matches: IMatch[]): EventSlotPlan[]
```

Prinzip:

1. Kandidaten berechnen.
2. Kandidaten scoren.
3. Besten Kandidaten nehmen.
4. Teams dieses Kandidaten für denselben Planungsschritt blockieren.
5. Weitere Kandidaten hinzufügen, solange keine Team-Kollision entsteht.
6. Ergebnis stabil sortiert zurückgeben.

#### 4. Bestehendes UI-Verhalten beibehalten

Die UI soll weiterhin „Als Nächstes“ anzeigen.
Nur die Reihenfolge und Auswahl der vorgeschlagenen Matches darf sich verbessern.

#### 5. Direkt nächste Matches einfrieren

Die **direkt nächsten / aktuell vorgeschlagenen Matches dürfen nicht bei jedem Refresh neu kalkuliert und ausgetauscht werden**, sobald sie dem Admin angezeigt wurden. Dadurch wird verhindert, dass sich ein Match ändert, während Spieler bereits auf dem Weg zum Spiel sind oder der Admin es gerade ansagt.

Stattdessen:

- Slot 1 / direkt nächste Matches bleiben stabil, solange sie weiterhin spielbar und nicht abgeschlossen sind.
- Nach einem Ergebnis wird erst der nachgelagerte Vorschau-Bereich neu berechnet.
- Der greedy Scheduler soll primär die **zweiten nächsten / danach kommenden Matches** neu planen.
- Ein direkt nächstes Match darf nur verschwinden, wenn es abgeschlossen wurde, durch einen Rollback/Änderung ungültig wurde oder nicht mehr beide Teilnehmer bekannt sind.

Nicht ändern:

- Ergebnis-Eintragung
- Winner-Buttons
- Stats-Anzeige
- Bracket-Rendering
- Winner-Routing

### Akzeptanzkriterien

- „Als Nächstes“ zeigt nur Matches mit beiden bekannten Teilnehmern.
- Kein Team erscheint gleichzeitig in zwei vorgeschlagenen nächsten Matches.
- Wenn mehrere Disziplinen offen sind, werden sie möglichst gleichmäßig fortgeführt.
- Wenn ein Match ein Folgematch freischalten kann, wird es bevorzugt gegenüber weniger dringenden Matches.
- Finals erscheinen nicht zu früh, solange abhängige niedrigere Runden derselben Disziplin offen sind.
- Die Reihenfolge ist deterministisch und flackert nicht zwischen Refreshes.
- Direkt nächste Matches bleiben stabil und werden nicht bei jedem Polling durch andere Kandidaten ersetzt.
- Der greedy Algorithmus optimiert auf Gesamt-Laufzeit/Turnierfluss, nicht auf starre komplette Rundenblöcke.
- Bestehende Event-Stats und Ergebnislogik bleiben unverändert.
- Bestehende Tests bleiben grün.

### TDD-Testplan

#### Test 1: schlägt nur spielbare Matches vor

Datei:

- `__tests__/lib/eventTournament.test.ts`

Szenario:

- Event-Bracket mit mehreren Runden
- einige Matches haben nur einen Teilnehmer
- einige Matches sind completed
- einige Matches sind ready

Erwartung:

- `planEventSlots()` enthält nur Matches mit `teamA` und `teamB`
- completed Matches erscheinen nicht erneut
- Freilose erscheinen nicht als manuell spielbare Matches

#### Test 2: verhindert Team-Kollisionen in derselben Vorschlagsgruppe

Szenario:

- Mehrere theoretisch spielbare Matches
- ein Team taucht durch Graph-Zustand in mehr als einem Kandidaten auf

Erwartung:

- der greedy Plan nimmt nur eines dieser Matches in denselben Slot
- das kollidierende Match rutscht nach hinten

#### Test 3: balanciert Disziplinen

Szenario:

- Disziplin A ist bereits weiter als Disziplin B
- in beiden Disziplinen sind Matches spielbar

Erwartung:

- Disziplin B bekommt Vorrang, solange harte Regeln erfüllt sind

#### Test 4: bevorzugt Matches, die Folgematches freischalten

Szenario:

- zwei Matches sind spielbar
- eines davon komplettiert danach beide Teilnehmer eines Folgematches

Erwartung:

- dieses Match bekommt höheren Score und wird früher vorgeschlagen

#### Test 5: deterministische Reihenfolge

Szenario:

- gleicher Turnierzustand wird mehrfach geplant

Erwartung:

- `planEventSlots()` liefert jedes Mal dieselbe Reihenfolge

#### Test 6: optimiert Gesamt-Laufzeit statt starrer Rundenblöcke

Szenario:

- ein Runde-2-Match ist vollständig spielbar und schaltet den weiteren Graphen frei
- parallel existiert noch ein anderes Runde-1-Match in einer anderen Disziplin

Erwartung:

- der Scheduler darf das Runde-2-Match früher vorschlagen, wenn es den Gesamtfluss verbessert
- es gibt keine harte Regel „alle Runde-1-Matches vor irgendeinem Runde-2-Match“

#### Test 7: friert direkt nächste Matches ein

Szenario:

- Slot 1 enthält aktuell vorgeschlagene spielbare Matches
- durch ein anderes Ergebnis entstehen neue Kandidaten mit höherem greedy Score

Erwartung:

- Slot 1 bleibt unverändert, solange die bisherigen Matches weiterhin spielbar sind
- nur die danach folgenden Vorschau-Matches werden neu berechnet
- erst nach Abschluss/Invalidierung rücken neue Matches nach

### Implementierungsplan

1. Bestehende `planEventSlots()`-Tests lesen und Verhalten dokumentieren.
2. Failing Test für „nur spielbare Matches“ schreiben.
3. Minimalen Kandidatenfilter implementieren.
4. Failing Test für Team-Kollisionen schreiben.
5. Greedy-Auswahl mit blockierten Team-IDs implementieren.
6. Failing Test für Disziplin-Balancing schreiben.
7. Score um Disziplin-Fortschritt erweitern.
8. Failing Test für Freischalt-Bonus schreiben.
9. Score um Next-Match-Bonus erweitern.
10. Failing Test für Gesamt-Laufzeit statt starrer Rundenblöcke schreiben.
11. Score/Tie-Breaker so anpassen, dass Runden nur weiche Priorität sind.
12. Failing Test für eingefrorene direkt nächste Matches schreiben.
13. Planungsfunktion um bereits angezeigte direkte Matches / Slot-1-Stabilität erweitern.
14. Failing Test für deterministische Reihenfolge schreiben.
15. Stabilen Tie-Breaker ergänzen.
16. UI-Komponententests für „Als Nächstes“ aktualisieren.
17. Zieltests ausführen.
18. Full Test Suite ausführen.
19. Erst danach committen/deployen.

### Verifikation

Vor Commit mindestens:

```bash
npm test -- --run __tests__/lib/eventTournament.test.ts __tests__/components/EventTournamentView.test.tsx
npm run typecheck
npm run lint
npm run build
```

Vor Deploy zusätzlich:

```bash
npm test
```

### Nicht Teil dieses Issues

- Keine Änderung an Winner-Routing.
- Keine Änderung an Stats-Berechnung.
- Keine Änderung an Freilos-Wertung.
- Keine Änderung an Disconnect-/Stale-Update-Schutz.
- Keine neue manuelle Sortier-UI.
- Keine automatische Court-Zuweisung.

### Geklärte Zusatzanforderungen

- Der greedy Algorithmus soll auf die **Gesamt-Laufzeit / den Gesamtfluss des Event-Turniers** schauen.
- Es soll keine harte Reihenfolge „Runde 1 komplett vor Runde 2 komplett vor Runde 3“ geben.
- Die **direkt nächsten Matches** sollen nach Anzeige stabil bleiben und nicht bei jedem Polling neu gemischt werden.
- Neu kalkuliert werden primär die **zweiten nächsten / danach kommenden Matches**, damit sich nicht ändert, wohin Teams/Spieler bereits unterwegs sind.

### Noch offene Feinabstimmung

Vor Implementierung optional klären, welche Laufzeit-Metrik am wichtigsten ist:

- weniger Wartezeit pro Team?
- gleichmäßige Disziplin-Verteilung?
- möglichst früh Folgematches freischalten?
- möglichst wenig direkte Wiederholung der gleichen Teams?
- Court-/Slot-Auslastung?

Bis zur weiteren Klärung gilt die Annahme: Gesamtfluss + stabile direkte Matches sind wichtiger als starre Rundennummer-Reihenfolge.

**Implemented notes:**

- The event scheduler selects currently playable matches using greedy flow-based prioritization.
- Later-round matches can be proposed before unrelated earlier matches when dependencies are fulfilled and it improves tournament flow.
- Suggested matches avoid putting the same team into multiple simultaneous open suggestions.
- Recalculated future suggestions stay read-only in the UI.

37. [implemented] Admin Manage View: linke Sidebar ausblendbar

**Status:** implementiert

### Ziel

Im Admin-Turnier-Manage-View kann die linke Admin-Navigation ausgeblendet werden, damit der Turnierbaum bzw. die Manage-Ansicht mehr Platz bekommt.

### Implementiert

- Auf `/admin/tournament/[id]/manage` gibt es einen Desktop-Button zum Ausblenden der linken Sidebar.
- Nach dem Ausblenden erscheint links oben ein kompakter Button zum Wieder-Einblenden.
- Die Funktion ist auf die Turnier-Manage-Seite beschränkt.
- Mobile Navigation bleibt unverändert.
- Deutsche und englische Labels sind in i18n ergänzt.

## 38. [implemented] Event Tournaments: optimierter Bracket-Algorithmus statt reiner Zufall

**Status:** implementiert  
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

### Implementierungsnotizen

- Randomized Optimized Draw ist in `lib/eventTournament.ts` implementiert.
- Der Generator bewertet Kandidaten gegen eine Event-Draw-Historie und wählt den niedrigsten Fairness-/Wiederholungs-Score.
- Direkte Round-1-Rematches werden stark bestraft. Bereits bekannte Matchups werden nach Möglichkeit in gegenüberliegende Baumhälften gelegt, sodass ein erneutes Aufeinandertreffen frühestens im Finale möglich ist.
- Kleine 8er-Event-Brackets werden für die Tests/Optimalauswahl vollständig über Pairings und Layout-Permutationen bewertet; größere Felder nutzen reproduzierbare Kandidatensuche über `drawSeed`.
- Freilos-Regeln bleiben erhalten; mehrere Freilose werden nicht unnötig in denselben frühen Pfad gelegt.
- Neue Tests prüfen, dass der erzeugte 8-Team-Folge-Draw den optimalen Score erreicht und frühere direkte Matchups auf den Finalpfad verschiebt.

