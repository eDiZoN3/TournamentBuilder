1. [planned] Performance Upgrade / Skalierbarkeits-Upgrade

   Ziel: TournamentBuilder soll bei mehr parallelen Nutzern, mehreren offenen Live-/Admin-Ansichten und wachsender Turnier-/Match-Historie stabil, schnell und besser beobachtbar bleiben. Der aktuelle PM2-Cluster ist als Single-Server-Basis gut, aber die eigentlichen Skalierungshebel liegen bei Polling, Datenmodell, Stats-Berechnung, API-Antwortgrößen und Race-Condition-Schutz.

   - Aktuellen Ist-Zustand messen, bevor Architektur geändert wird:
     - Lasttests für `/`, `/api/tournaments`, `/api/tournaments/:id`, `/api/tournaments/:id/stats`, Match-Update-Routen und Setup-/Join-Flow ergänzen.
     - Zielmetriken definieren: p95-Latenz, Error-Rate, CPU/RAM pro PM2-Worker, MongoDB-Abfragezeiten, gleichzeitige Nutzer/Tabs.
     - PM2-, Proxy- und MongoDB-Metriken dokumentieren, damit Verbesserungen vergleichbar sind.

   - Polling-Last reduzieren:
     - Das aggressive Setup-Polling für joined players prüfen und entschärfen, aktuell sehr kurze Intervalle vermeiden.
     - Nur pollen, solange der Browser-Tab sichtbar ist (`document.visibilityState`).
     - SWR-/Fetch-Dedupe und adaptive Intervalle verwenden, z. B. seltener pollen bei inaktiven/abgeschlossenen Turnieren.
     - Mittelfristig Polling für Live-Turnierupdates durch SSE oder WebSocket ersetzen, damit Clients nur bei echten Änderungen refreshen.

   - Stats-Berechnung skalierbarer machen:
     - Tournament-Stats nicht bei jedem Request vollständig aus dem Turnier neu berechnen, sondern Snapshots/materialisierte Stats einführen.
     - Stats-Snapshots bei relevanten Änderungen invalidieren/aktualisieren: Match-Ergebnis, Winner-Override, Score-Update, Tournament Start/Update/Delete, Stats-Reset-Regeln, Practice-Matches.
     - Globale Stats nicht mehr über alle Turniere und Practice-Matches pro Request komplett aggregieren, sondern cachen oder inkrementell/materialisiert speichern.

   - API-Antworten verkleinern und View-spezifische DTOs einführen:
     - Setup-Seiten sollen nur Setup-/Join-relevante Felder laden.
     - Live-Bracket-Views sollen nur Teams, Matches und aktuelle Match-IDs laden.
     - Listen-/Dashboard-Routen sollen keine vollständigen Tournament-Dokumente senden, wenn nur Name, Status, Datum und IDs gebraucht werden.
     - MongoDB-Projections verwenden, um große Arrays und nicht benötigte Felder nicht unnötig aus der Datenbank zu lesen.

   - MongoDB- und Datenmodell-Skalierung verbessern:
     - Mongoose-Verbindungspool bewusst konfigurieren, besonders weil jeder PM2-Worker einen eigenen Pool hat.
     - Indexes für häufige Query-Muster prüfen/ergänzen, z. B. Status, CreatedAt, Spieler-/Profilbezüge, Practice-Match-Statistiken.
     - Langfristig prüfen, ob große eingebettete Arrays (`teams`, `matches`, `joinedPlayers`) in separate Collections ausgelagert werden sollten: `Tournament`, `TournamentTeam`, `TournamentMatch`, `TournamentParticipant`, `TournamentStatsSnapshot`.
     - Embedded-Dokumente beibehalten, solange Turniere klein bleiben; Normalisierung erst umsetzen, wenn Messdaten oder Produktziel es rechtfertigen.

   - Race Conditions und parallele Admin-Aktionen absichern:
     - Match-/Winner-/Score-Updates idempotent gestalten.
     - Atomare MongoDB-Updates mit Bedingungen nutzen, z. B. nur aktualisieren, wenn Matchstatus/Version noch erwartet ist.
     - Optimistische Versionierung oder ähnliche Konflikterkennung für Tournament-Updates prüfen.
     - Kritische Routing-Logik bei Winner/Loser/Bye-Fortschreibung gegen parallele Requests testen.

   - PM2-Cluster gezielt optimieren:
     - Aktuell 3 Cluster-Instanzen auf 4 vCPU als solide Single-Host-Basis beibehalten.
     - Ob 4 Instanzen besser sind, nur per Lasttest entscheiden, nicht blind skalieren.
     - Healthcheck-Endpoint ergänzen und PM2-/Proxy-Checks nach Deploys automatisieren.
     - Memory-Leaks und Worker-Restarts über längere Laufzeit beobachten.

   - Horizontale Skalierung vorbereiten, falls TournamentBuilder später über einen einzelnen Server hinaus wachsen soll:
     - App-Server stateless halten, keine lokalen Dateien als relevanten Runtime-State verwenden.
     - Gemeinsame Secrets/Env-Konfiguration für mehrere App-Instanzen dokumentieren (`NEXTAUTH_SECRET`, DB-URI, Public URL).
     - Redis oder ähnlichen Shared Store für Cache, Rate-Limits und SSE/WebSocket-PubSub prüfen.
     - Zentralisiertes Logging/Metrics vorbereiten.
     - Später mögliches Zielbild: Load Balancer/Reverse Proxy -> mehrere Next.js-App-Server -> MongoDB Replica Set/Managed Mongo -> Redis für Cache/PubSub.

   - Tests/Verifikation für das Performance Upgrade:
     - Regression-Tests für Stats-Snapshots und Cache-Invalidierung.
     - Tests für parallele Match-/Winner-Updates.
     - Tests für reduzierte API DTOs, damit Views weiterhin alle benötigten Daten erhalten.
     - Lasttest-Skripte dokumentieren und als wiederholbare Performance-Baseline ablegen.
