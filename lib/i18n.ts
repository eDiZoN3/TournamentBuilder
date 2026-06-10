export const LOCALE_STORAGE_KEY = "raro-locale";

export type Locale = "en" | "de";

export type TranslationKey =
  | "account"
  | "active"
  | "addPlayer"
  | "addTeam"
  | "adminLogin"
  | "admin"
  | "adminNavigation"
  | "allowPlayerSelfJoin"
  | "accounts"
  | "apiDocsDescription"
  | "apiDocsTitle"
  | "assignCourt"
  | "assigning"
  | "allCourtsOccupied"
  | "bestOfThree"
  | "bestOfThreeSemisFinal"
  | "bestOfOne"
  | "bracketSelection"
  | "bye"
  | "cancel"
  | "changePassword"
  | "changePasswordDescription"
  | "changing"
  | "close"
  | "closeAdminNavigation"
  | "closeNavigationMenu"
  | "completed"
  | "confirmMatch"
  | "confirmDeleteButton"
  | "confirmNewPassword"
  | "confirmOverride"
  | "confirming"
  | "confirmResetStats"
  | "configureTournamentDescription"
  | "controls"
  | "court"
  | "courtsAvailable"
  | "courtAssigned"
  | "courtAssignedMessage"
  | "courtAssignedWithReplacement"
  | "courtOverride"
  | "courtOverrideFailed"
  | "courtsInUse"
  | "createAccount"
  | "createAccountDescription"
  | "createNewTournament"
  | "createPlayer"
  | "createTournament"
  | "createTournamentDescription"
  | "createTournamentLead"
  | "createdAccountSignInFailed"
  | "creating"
  | "currentPassword"
  | "dashboard"
  | "dashboardOverview"
  | "dashboardSections"
  | "delete"
  | "deleteConfirmationRequired"
  | "deleteFailed"
  | "deleteIncorrectName"
  | "diff"
  | "dismiss"
  | "dismissError"
  | "dismissTemporaryPassword"
  | "doubleElimination"
  | "draft"
  | "edit"
  | "email"
  | "emptyTournamentDescription"
  | "enableJavaScriptApiDocs"
  | "enterMinPlayers"
  | "enterAtLeastTwoTeamNames"
  | "enterPlayerNames"
  | "enterScores"
  | "enterTeamNames"
  | "exactPlayerCountRequirement"
  | "eventBrackets"
  | "eventChampion"
  | "eventOverview"
  | "eventSetupDescription"
  | "eventTournament"
  | "titleOpen"
  | "final"
  | "finalStandings"
  | "findRegisteredPlayer"
  | "firstName"
  | "followCurrentTournaments"
  | "generateMinTeams"
  | "generateTeams"
  | "globalStats"
  | "knockoutBracket"
  | "knockoutMatchOptions"
  | "invalidCredentials"
  | "joinedAs"
  | "joinedPlayers"
  | "joining"
  | "joinPhase"
  | "joinTournament"
  | "languageSwitchToEnglish"
  | "languageSwitchToGerman"
  | "lbFinal"
  | "live"
  | "liveCourt"
  | "loading"
  | "loadingBracket"
  | "loadingMatch"
  | "loadingTournament"
  | "logOut"
  | "loserBracket"
  | "loserBracketRounds"
  | "lost"
  | "losses"
  | "manualFirstRoundPairing"
  | "markAsInProgress"
  | "matchCompleted"
  | "matchConfirmed"
  | "matchInProgress"
  | "matchOverridden"
  | "matchUpdated"
  | "matchWinnerNotDetermined"
  | "match"
  | "matches"
  | "manage"
  | "manageVolleyballTournaments"
  | "manageTournamentLeadsNote"
  | "mobileNavigation"
  | "name"
  | "newPassword"
  | "newTournament"
  | "newTournamentLeadEmail"
  | "noCompletedMatches"
  | "noPlayableEventMatches"
  | "noPlayersListed"
  | "noPlayerAccounts"
  | "noPlayerStats"
  | "noPracticeMatches"
  | "noPracticeStats"
  | "noRegisteredPlayersFound"
  | "noTeamStats"
  | "noTournamentsYet"
  | "noTournamentLeadAccounts"
  | "onlyAdminsCanReset"
  | "openApiJson"
  | "openAdminNavigation"
  | "openNavigationMenu"
  | "oneSetPerMatch"
  | "opponentName"
  | "opponentNameRequired"
  | "opponentScore"
  | "overrideResult"
  | "password"
  | "passwordChangeRequired"
  | "passwordsDoNotMatch"
  | "pending"
  | "place"
  | "played"
  | "playedMatches"
  | "participantNameField"
  | "participants"
  | "player"
  | "playerAccount"
  | "playerAccounts"
  | "playerEmail"
  | "playerFirstName"
  | "playerJoined"
  | "playerAlreadySelected"
  | "playerName"
  | "playerNameField"
  | "playerRemainderWarning"
  | "players"
  | "playerSignUp"
  | "playerStats"
  | "playerSurname"
  | "practiceMatches"
  | "practicePlayerStats"
  | "practiceStats"
  | "points"
  | "pointsAgainst"
  | "pointsDiff"
  | "pointsFor"
  | "pointsScoring"
  | "discipline"
  | "disciplineNameField"
  | "disciplines"
  | "primaryNavigation"
  | "publicTournamentList"
  | "publicTournaments"
  | "publicView"
  | "quarterFinal"
  | "raroVolleyball"
  | "ready"
  | "registerPlayersNote"
  | "registeredAdmins"
  | "registeredPlayers"
  | "registeredTournaments"
  | "remove"
  | "resetScope"
  | "resetScopeAll"
  | "resetScopePlayer"
  | "resetScopeProfile"
  | "resetScopeSeason"
  | "resetScopeTournament"
  | "resetPlayerPassword"
  | "resetPlayerPasswordAction"
  | "resetStats"
  | "resultUpdated"
  | "resultUpdatedWithDownstreamReset"
  | "round"
  | "roundRobinMatchFormat"
  | "rosterSaved"
  | "randomFirstRoundPairing"
  | "saving"
  | "savePracticeMatch"
  | "saveRoster"
  | "saveSet"
  | "schedule"
  | "score"
  | "scoreSaved"
  | "semiFinal"
  | "singleElimination"
  | "slot"
  | "setOwnPassword"
  | "set"
  | "setSaved"
  | "setupTournamentTitle"
  | "shuffleTeams"
  | "signIn"
  | "signInDescription"
  | "signingIn"
  | "signUp"
  | "signUpToJoin"
  | "startTournament"
  | "standings"
  | "stats"
  | "statsReset"
  | "statsResetComplete"
  | "setsWonLost"
  | "status"
  | "setup"
  | "submitOverride"
  | "submitting"
  | "surname"
  | "switchToDarkMode"
  | "switchToLightMode"
  | "team"
  | "teamEntry"
  | "teamNameField"
  | "teamPreview"
  | "teamPreviewNameField"
  | "teamRoundRobin"
  | "teamsConfigured"
  | "teams"
  | "teamSize"
  | "teamStats"
  | "tempPassword"
  | "temporaryPasswordHelp"
  | "toBeDetermined"
  | "tournamentLead"
  | "tournamentAdmin"
  | "tournamentBracket"
  | "tournamentComplete"
  | "tournamentDeleted"
  | "tournamentFormat"
  | "tournamentLeadAccounts"
  | "tournamentLeadActions"
  | "tournamentLeadCreated"
  | "tournamentLeadRole"
  | "tournamentLeadStatus"
  | "tournamentManagement"
  | "tournamentName"
  | "tournamentStats"
  | "tournaments"
  | "typeToConfirm"
  | "unableToAssignCourt"
  | "unableToChangePassword"
  | "unableToConfirmMatch"
  | "unableToCreateAdminAccount"
  | "unableToCreatePlayerAccount"
  | "unableToCreateTournament"
  | "unableToDeletePracticeMatch"
  | "unableToDeleteTournament"
  | "unableToGenerateTeams"
  | "unableToJoinTournament"
  | "unableToLoadTournament"
  | "unableToOverrideMatch"
  | "unableToRefresh"
  | "unableToRemoveTournamentLead"
  | "unableToResetPlayerPassword"
  | "unableToSavePracticeMatch"
  | "unableToSaveScore"
  | "unableToSaveTournamentTeams"
  | "unableToSignIn"
  | "unableToStartTournament"
  | "unableToUpdateMatch"
  | "upNext"
  | "updating"
  | "view"
  | "versus"
  | "viewInBracket"
  | "volleyballTournaments"
  | "winRate"
  | "won"
  | "winner"
  | "winnerOnly"
  | "winnerBracket"
  | "winnerBracketRounds"
  | "teamWon"
  | "changingWinnerWarning"
  | "wins"
  | "yourScore"
  | "addParticipantsNote"
  | "completedNonByeMatches"
  | "individualMixer";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  de: {
    account: "Konto",
    active: "Aktiv",
    addPlayer: "Spieler hinzufügen",
    addTeam: "Team hinzufügen",
    adminLogin: "Admin-Login",
    allowPlayerSelfJoin: "Spieler selbst beitreten lassen",
    assignCourt: "Feld zuweisen",
    bestOfThree: "Best of three",
    bestOfThreeSemisFinal: "Best-of-three Halbfinale und Finale",
    cancel: "Abbrechen",
    changePassword: "Passwort ändern",
    changePasswordDescription:
      "Legen Sie Ihr eigenes Passwort fest, bevor Sie fortfahren.",
    completed: "Abgeschlossen",
    confirmDeleteButton: "Löschen bestätigen",
    confirmNewPassword: "Neues Passwort bestätigen",
    confirmResetStats: "Geben Sie RESET STATS ein, um zu bestätigen",
    controls: "Steuerung",
    courtsAvailable: "Verfügbare Felder",
    courtAssigned: "Feld zugewiesen",
    createAccount: "Konto erstellen",
    createAccountDescription:
      "Erstellen Sie ein Konto, um offenen Turnieren beizutreten und Ihre Statistiken zu verfolgen.",
    createNewTournament: "Neues Turnier erstellen",
    createPlayer: "Spieler erstellen",
    createTournament: "Turnier erstellen",
    createTournamentLead: "Turnierleiter anlegen",
    currentPassword: "Aktuelles Passwort",
    dashboard: "Dashboard",
    delete: "Löschen",
    deleteConfirmationRequired: "Löschbestätigung erforderlich",
    deleteFailed: "Löschen fehlgeschlagen",
    deleteIncorrectName: "Geben Sie {name} ein, um das Löschen zu bestätigen.",
    diff: "Diff",
    dismiss: "Schließen",
    doubleElimination: "Double Elimination",
    draft: "Entwurf",
    edit: "Bearbeiten",
    email: "E-Mail",
    enterMinPlayers: "Geben Sie mindestens {n} Spieler ein.",
    enterPlayerNames: "Spielernamen eingeben",
    enterTeamNames: "Teamnamen eingeben",
    exactPlayerCountRequirement:
      "Spieleranzahl muss durch die Teamgröße teilbar sein.",
    eventBrackets: "Brackets",
    eventChampion: "Disziplinsieger: ",
    eventOverview: "Event-Übersicht",
    eventSetupDescription:
      "Teilnehmer und Disziplinen für dieses Event eintragen.",
    eventTournament: "Event-Turnier",
    findRegisteredPlayer: "Registrierten Spieler suchen",
    finalStandings: "Endstand",
    firstName: "Vorname",
    followCurrentTournaments:
      "Aktuelle Turniere verfolgen und abgeschlossene Spiele ansehen.",
    generateMinTeams: "Generieren Sie mindestens zwei benannte Teams.",
    generateTeams: "Teams generieren",
    globalStats: "Globale Statistiken",
    knockoutBracket: "KO-System",
    knockoutMatchOptions: "KO-Spieloptionen",
    invalidCredentials: "Ungültige E-Mail oder Passwort.",
    joinedPlayers: "Beigetretene Spieler",
    joinPhase: "Beitrittphase",
    languageSwitchToEnglish: "Sprache auf Englisch wechseln",
    languageSwitchToGerman: "Sprache auf Deutsch wechseln",
    loading: "Laden",
    loadingBracket: "Turnierbaum wird geladen",
    loadingTournament: "Turnier wird geladen...",
    logOut: "Abmelden",
    lost: "Verloren",
    losses: "Niederlagen",
    manualFirstRoundPairing: "Erstrunden-Paarungen manuell",
    matchUpdated: "Spiel aktualisiert",
    match: "Spiel",
    matches: "Spiele",
    manage: "Verwalten",
    manageVolleyballTournaments: "Turniere verwalten.",
    name: "Name",
    newPassword: "Neues Passwort",
    newTournament: "Neues Turnier",
    newTournamentLeadEmail: "E-Mail des neuen Turnierleiters",
    noPlayerAccounts: "Noch keine Spielerkonten.",
    noPlayerStats: "Noch keine Spielerstatistiken",
    noPracticeMatches: "Noch keine Trainingsspiele",
    noPracticeStats: "Noch keine Trainingsstatistiken",
    noRegisteredPlayersFound: "Keine registrierten Spieler gefunden.",
    noTeamStats: "Noch keine Teamstatistiken",
    noTournamentsYet: "Noch keine Turniere.",
    noTournamentLeadAccounts: "Noch keine Turnierleiter-Konten.",
    onlyAdminsCanReset: "Nur Administratoren können Statistiken zurücksetzen.",
    oneSetPerMatch: "Ein Satz pro Spiel",
    opponentName: "Gegnername",
    opponentScore: "Gegnerpunkte",
    password: "Passwort",
    passwordChangeRequired: "Passwortänderung erforderlich",
    passwordsDoNotMatch: "Neue Passwörter stimmen nicht überein.",
    place: "Platz",
    played: "Gespielt",
    playedMatches: "Gespielte Spiele",
    participantNameField: "Teilnehmer {n} Name",
    participants: "Teilnehmer",
    player: "Spieler",
    playerAccount: "Spielerkonto",
    playerAccounts: "Spielerkonten",
    playerEmail: "E-Mail des Spielers",
    playerFirstName: "Vorname des Spielers",
    playerAlreadySelected: "Dieser Spieler ist bereits ausgewählt.",
    playerJoined: "{n} Spieler sind beigetreten",
    playerName: "Name des Spielers",
    players: "Spieler",
    playerSignUp: "Spielerregistrierung",
    playerStats: "Spielerstatistiken",
    playerSurname: "Nachname des Spielers",
    practiceMatches: "Trainingsspiele",
    practicePlayerStats: "Trainingsspielerstatistiken",
    practiceStats: "Trainingsstatistiken",
    points: "Punkte",
    pointsAgainst: "Punkte gegen",
    pointsScoring: "Mit Punkten",
    pointsFor: "Punkte für",
    discipline: "Disziplin",
    disciplineNameField: "Disziplin {n} Name",
    disciplines: "Disziplinen",
    publicTournaments: "Öffentliche Turniere",
    raroVolleyball: "Turnier Manager",
    registerPlayersNote:
      "Registrieren Sie Spieler und setzen Sie Kontokennwörter zurück.",
    registeredAdmins: "Registrierte Administratoren",
    registeredPlayers: "Registrierte Spieler",
    registeredTournaments: "Registrierte Turniere",
    remove: "Entfernen",
    resetScope: "Bereich zurücksetzen",
    resetScopeAll: "Alle Statistiken",
    resetScopePlayer: "Spieler",
    resetScopeProfile: "Profil",
    resetScopeSeason: "Saison",
    resetScopeTournament: "Turnier",
    resetStats: "Statistiken zurücksetzen",
    round: "Runde",
    roundRobinMatchFormat: "Round-Robin-Spielformat",
    rosterSaved: "Kader gespeichert.",
    randomFirstRoundPairing: "Erstrunden-Paarungen zufällig",
    saving: "Speichern...",
    savePracticeMatch: "Trainingsspiel speichern",
    saveRoster: "Kader speichern",
    schedule: "Spielplan",
    score: "Ergebnis",
    singleElimination: "Single Elimination",
    slot: "Slot",
    setOwnPassword:
      "Legen Sie Ihr eigenes Passwort fest, bevor Sie fortfahren.",
    setupTournamentTitle: "Richten Sie {name} ein",
    signIn: "Anmelden",
    signingIn: "Anmelden...",
    signUp: "Registrieren",
    startTournament: "Turnier starten",
    standings: "Tabelle",
    stats: "Statistiken",
    statsReset: "Statistiken zurücksetzen",
    statsResetComplete: "Statistiken wurden zurückgesetzt.",
    setsWonLost: "Sätze S-N",
    setup: "Einrichten",
    status: "Status",
    surname: "Nachname",
    team: "Team",
    teamEntry: "Teameingabe",
    teamPreview: "Teamvorschau",
    teamRoundRobin: "Team-Round-Robin",
    teamsConfigured: "{n} Teams eingetragen",
    teams: "Teams",
    teamSize: "Teamgröße",
    teamStats: "Teamstatistiken",
    tempPassword: "Temporäres Passwort",
    tournamentAdmin: "Turnierverwaltung",
    tournamentBracket: "Turnieransicht",
    tournamentComplete: "Turnier abgeschlossen",
    tournamentDeleted: "Turnier gelöscht",
    tournamentFormat: "Turnierformat",
    tournamentLeadAccounts: "Turnierleiter-Konten",
    tournamentLeadActions: "Aktionen",
    tournamentLeadCreated: "Erstellt",
    tournamentLeadRole: "Rolle",
    tournamentLeadStatus: "Status",
    tournamentManagement: "Turnierverwaltung",
    tournamentName: "Turniername",
    tournamentStats: "Turnierstatistiken",
    tournaments: "Turniere",
    typeToConfirm: "Geben Sie ein, um zu bestätigen",
    unableToGenerateTeams: "Konnte Teams nicht generieren.",
    unableToRefresh: "Konnte nicht aktualisieren",
    unableToSaveTournamentTeams: "Konnte Turnierteams nicht speichern.",
    unableToStartTournament: "Turnier konnte nicht gestartet werden.",
    unableToUpdateMatch: "Konnte das Spiel nicht aktualisieren",
    upNext: "Als Nächstes",
    view: "Ansehen",
    volleyballTournaments: "Turniere",
    winRate: "Siegquote",
    won: "Gewonnen",
    winnerOnly: "Nur Sieger",
    wins: "Siege",
    yourScore: "Deine Punkte",
    accounts: "Konten",
    admin: "Admin",
    adminNavigation: "Admin-Navigation",
    allCourtsOccupied: "Alle Felder belegt",
    apiDocsDescription: "Interaktive Dokumentation aus dem OpenAPI-Dokument.",
    apiDocsTitle: "Swagger API-Dokumentation",
    assigning: "Zuweisen...",
    bestOfOne: "Best of 1",
    bracketSelection: "Turnierbaum-Auswahl",
    bye: "Freilos",
    changing: "Ändern...",
    close: "Schließen",
    closeAdminNavigation: "Admin-Navigation schließen",
    closeNavigationMenu: "Navigationsmenü schließen",
    confirmMatch: "Spiel bestätigen",
    confirmOverride: "Überschreiben bestätigen",
    confirming: "Bestätigen...",
    configureTournamentDescription:
      "Konfigurieren Sie das Turnier, bevor Sie Teams oder Spieler eingeben.",
    court: "Feld",
    courtAssignedMessage: "Feld {court} wurde zugewiesen.",
    courtAssignedWithReplacement:
      "Feld {court} wurde zugewiesen; das vorherige Spiel ist wieder bereit.",
    courtOverride: "Feld überschreiben",
    courtOverrideFailed: "Feldüberschreibung fehlgeschlagen",
    courtsInUse: "{current}/{total} Felder in Nutzung",
    createTournamentDescription:
      "Konfigurieren Sie das Turnier, bevor Sie Teams oder Spieler eingeben.",
    createdAccountSignInFailed:
      "Konto erstellt, aber die Anmeldung ist fehlgeschlagen.",
    creating: "Erstellen...",
    dashboardOverview: "Dashboard-Übersicht",
    dashboardSections: "Dashboard-Bereiche",
    dismissError: "Fehler schließen",
    dismissTemporaryPassword: "Temporäres Passwort schließen",
    emptyTournamentDescription: "Erstellen Sie eins, um Spiele zu planen.",
    enableJavaScriptApiDocs:
      "Aktivieren Sie JavaScript, um Swagger UI anzuzeigen. Das OpenAPI-JSON ist unter /api/openapi verfügbar.",
    enterAtLeastTwoTeamNames: "Geben Sie mindestens zwei Teamnamen ein.",
    enterScores: "Ergebnisse eingeben",
    final: "Finale",
    joinedAs: "Beigetreten als {name}",
    joining: "Beitreten...",
    joinTournament: "Turnier beitreten",
    lbFinal: "LB-Finale",
    live: "LIVE",
    liveCourt: "Live, Feld {court}",
    loadingMatch: "Spiel wird geladen",
    loserBracket: "Verliererbaum",
    loserBracketRounds: "Runden im Verliererbaum",
    manageTournamentLeadsNote:
      "Turnierleiter erstellen und temporäre Passwörter zurücksetzen.",
    markAsInProgress: "Als laufend markieren",
    matchCompleted: "{match} wurde abgeschlossen.",
    matchConfirmed: "Spiel bestätigt",
    matchInProgress: "{match} läuft jetzt.",
    matchOverridden: "Spiel überschrieben",
    matchWinnerNotDetermined: "Der Spielsieger wurde noch nicht ermittelt",
    mobileNavigation: "Mobile Navigation",
    noCompletedMatches: "Noch keine abgeschlossenen Spiele.",
    noPlayableEventMatches: "Keine spielbaren Event-Matches.",
    noPlayersListed: "Keine Spieler eingetragen",
    openApiJson: "OpenAPI JSON",
    openAdminNavigation: "Admin-Navigation öffnen",
    openNavigationMenu: "Navigationsmenü öffnen",
    opponentNameRequired: "Gegnername ist erforderlich.",
    overrideResult: "Ergebnis überschreiben",
    pending: "Ausstehend",
    pointsDiff: "Punkte +/-",
    primaryNavigation: "Hauptnavigation",
    publicTournamentList: "Öffentliche Turnierliste",
    publicView: "Öffentliche Ansicht",
    quarterFinal: "Viertelfinale",
    ready: "Bereit",
    resetPlayerPassword: "Passwort zurücksetzen",
    resetPlayerPasswordAction: "Passwort für {name} zurücksetzen",
    resultUpdated: "Ergebnis aktualisiert.",
    resultUpdatedWithDownstreamReset:
      "Ergebnis aktualisiert und {count} nachgelagertes Spiel zurückgesetzt.",
    saveSet: "Satz speichern",
    scoreSaved: "Ergebnis gespeichert",
    semiFinal: "Halbfinale",
    set: "Satz",
    setSaved: "Satz {set} wurde gespeichert.",
    shuffleTeams: "Teams mischen",
    signInDescription:
      "Melden Sie sich mit Ihrem Turnier- oder Spielerkonto an.",
    signUpToJoin: "Zum Beitreten registrieren",
    submitOverride: "Überschreibung senden",
    submitting: "Senden...",
    switchToDarkMode: "In den Dunkelmodus wechseln",
    switchToLightMode: "In den Hellmodus wechseln",
    teamNameField: "Team {n} Name",
    teamPreviewNameField: "Teamvorschau {n} Name",
    temporaryPasswordHelp:
      "Teilen Sie dieses temporäre Passwort. Der Benutzer muss danach ein eigenes Passwort festlegen.",
    titleOpen: "Titel offen",
    toBeDetermined: "Offen",
    tournamentLead: "Turnierleiter",
    unableToAssignCourt: "Konnte Feld nicht zuweisen.",
    unableToChangePassword: "Konnte Passwort nicht ändern.",
    unableToConfirmMatch: "Konnte Spiel nicht bestätigen.",
    unableToCreateAdminAccount: "Konnte Admin-Konto nicht erstellen.",
    unableToCreatePlayerAccount: "Konnte Spielerkonto nicht erstellen.",
    unableToCreateTournament: "Konnte Turnier nicht erstellen.",
    unableToDeletePracticeMatch: "Konnte Trainingsspiel nicht löschen.",
    unableToDeleteTournament: "Konnte Turnier nicht löschen.",
    unableToJoinTournament: "Konnte Turnier nicht beitreten.",
    unableToLoadTournament: "Konnte Turnier nicht laden.",
    unableToOverrideMatch: "Konnte Spiel nicht überschreiben.",
    unableToRemoveTournamentLead: "Konnte Turnierleiter nicht entfernen.",
    unableToResetPlayerPassword: "Konnte Spielerpasswort nicht zurücksetzen.",
    unableToSavePracticeMatch: "Konnte Trainingsspiel nicht speichern.",
    unableToSaveScore: "Konnte Ergebnis nicht speichern.",
    unableToSignIn: "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    updating: "Aktualisieren...",
    versus: "vs",
    viewInBracket: "Im Bracket anzeigen",
    winner: "Sieger",
    teamWon: "{team} hat gewonnen",
    winnerBracket: "Gewinnerbaum",
    winnerBracketRounds: "Runden im Gewinnerbaum",
    changingWinnerWarning:
      "Eine Änderung des Siegers setzt nachgelagerte Spiele zurück.",
    playerNameField: "Spieler {n} Name",
    playerRemainderWarning:
      "Einige Spieler werden dem letzten Team hinzugefügt.",
    addParticipantsNote:
      "Fügen Sie Teilnehmer hinzu und bestätigen Sie die Teams, bevor Sie das Turnier starten.",
    completedNonByeMatches: "Gespielte Matches",
    individualMixer: "Einzel-Mixer",
  },
  en: {
    account: "Account",
    active: "Active",
    addPlayer: "Add player",
    addTeam: "Add team",
    adminLogin: "Admin login",
    allowPlayerSelfJoin: "Allow player account self-join",
    assignCourt: "Assign court",
    bestOfThree: "Best of three",
    bestOfThreeSemisFinal: "Best-of-three semi-finals and final",
    cancel: "Cancel",
    changePassword: "Change password",
    changePasswordDescription: "Set your own password before continuing.",
    completed: "Completed",
    confirmDeleteButton: "Confirm Delete",
    confirmNewPassword: "Confirm new password",
    confirmResetStats: "Type RESET STATS to confirm",
    controls: "Controls",
    courtsAvailable: "Courts available",
    courtAssigned: "Court assigned",
    createAccount: "Create account",
    createAccountDescription:
      "Create an account to join open tournaments and track your stats.",
    createNewTournament: "Create New Tournament",
    createPlayer: "Create player",
    createTournament: "Create tournament",
    createTournamentLead: "Create tournament lead",
    currentPassword: "Current password",
    dashboard: "Dashboard",
    delete: "Delete",
    deleteConfirmationRequired: "Delete confirmation required",
    deleteFailed: "Delete failed",
    deleteIncorrectName: "Type {name} to confirm deletion.",
    diff: "Diff",
    dismiss: "Dismiss",
    doubleElimination: "Double elimination",
    draft: "Draft",
    edit: "Edit",
    email: "Email",
    enterMinPlayers: "Enter at least {n} players.",
    enterPlayerNames: "Enter player names",
    enterTeamNames: "Enter team names",
    exactPlayerCountRequirement: "Player count must be divisible by team size.",
    eventBrackets: "Brackets",
    eventChampion: "Champion",
    eventOverview: "Event overview",
    eventSetupDescription: "Enter participants and disciplines for this event.",
    eventTournament: "Event tournament",
    findRegisteredPlayer: "Find registered player",
    finalStandings: "Final standings",
    firstName: "First name",
    followCurrentTournaments:
      "Follow current tournaments and review completed brackets.",
    generateMinTeams: "Generate at least two named teams.",
    generateTeams: "Generate teams",
    globalStats: "Global stats",
    knockoutBracket: "Knockout bracket",
    knockoutMatchOptions: "Knockout match options",
    invalidCredentials: "Invalid email or password.",
    joinedPlayers: "Joined players",
    joinPhase: "Join phase",
    languageSwitchToEnglish: "Switch language to English",
    languageSwitchToGerman: "Switch language to German",
    loading: "Loading",
    loadingBracket: "Loading bracket",
    loadingTournament: "Loading tournament...",
    logOut: "Log out",
    lost: "Lost",
    losses: "Losses",
    manualFirstRoundPairing: "Manual first-round pairing",
    matchUpdated: "Match updated",
    match: "Match",
    matches: "Matches",
    manage: "Manage",
    manageVolleyballTournaments: "Manage tournaments.",
    name: "Name",
    newPassword: "New password",
    newTournament: "New tournament",
    newTournamentLeadEmail: "New tournament lead email",
    noPlayerAccounts: "No player accounts yet.",
    noPlayerStats: "No player stats yet",
    noPracticeMatches: "No practice matches yet",
    noPracticeStats: "No practice stats yet",
    noRegisteredPlayersFound: "No registered players found.",
    noTeamStats: "No team stats yet",
    noTournamentsYet: "No tournaments yet.",
    noTournamentLeadAccounts: "No tournament lead accounts yet.",
    onlyAdminsCanReset: "Only admins can reset stats.",
    oneSetPerMatch: "One set per match",
    opponentName: "Opponent name",
    opponentScore: "Opponent score",
    password: "Password",
    passwordChangeRequired: "Password change required",
    passwordsDoNotMatch: "New passwords do not match.",
    place: "Place",
    played: "Played",
    playedMatches: "Played matches",
    participantNameField: "Participant {n} name",
    participants: "Participants",
    player: "Player",
    playerAccount: "Player account",
    playerAccounts: "Player accounts",
    playerEmail: "Player email",
    playerFirstName: "Player first name",
    playerAlreadySelected: "This player is already selected.",
    playerJoined: "{n} player{s} joined",
    playerName: "Player name",
    players: "players",
    playerSignUp: "Player sign up",
    playerStats: "Player stats",
    playerSurname: "Player surname",
    practiceMatches: "Practice matches",
    practicePlayerStats: "Practice player stats",
    practiceStats: "Practice stats",
    points: "Points",
    pointsAgainst: "Points Against",
    pointsScoring: "Points scoring",
    pointsFor: "Points For",
    discipline: "Discipline",
    disciplineNameField: "Discipline {n} name",
    disciplines: "Disciplines",
    publicTournaments: "Public tournaments",
    raroVolleyball: "Tournament Manager",
    registerPlayersNote: "Register players and reset account passwords.",
    registeredAdmins: "Registered admins",
    registeredPlayers: "Registered players",
    registeredTournaments: "Registered tournaments",
    remove: "Remove",
    resetScope: "Reset scope",
    resetScopeAll: "All stats",
    resetScopePlayer: "Player",
    resetScopeProfile: "Profile",
    resetScopeSeason: "Season",
    resetScopeTournament: "Tournament",
    resetStats: "Reset stats",
    round: "Round",
    roundRobinMatchFormat: "Round-robin match format",
    rosterSaved: "Roster saved.",
    randomFirstRoundPairing: "Random first-round pairing",
    saving: "Saving...",
    savePracticeMatch: "Save practice match",
    saveRoster: "Save roster",
    schedule: "Schedule",
    score: "Score",
    singleElimination: "Single elimination",
    slot: "Slot",
    setOwnPassword: "Set your own password before continuing.",
    setupTournamentTitle: "Set up {name}",
    signIn: "Sign in",
    signingIn: "Signing in...",
    signUp: "Sign up",
    startTournament: "Start tournament",
    standings: "Standings",
    stats: "Stats",
    statsReset: "Stats reset",
    statsResetComplete: "Stats reset complete.",
    setsWonLost: "Sets W-L",
    setup: "Setup",
    status: "Status",
    surname: "Surname",
    team: "Team",
    teamEntry: "Team entry",
    teamPreview: "Team preview",
    teamRoundRobin: "Team round robin",
    teamsConfigured: "{n} teams configured",
    teams: "Teams",
    teamSize: "Team size",
    teamStats: "Team stats",
    tempPassword: "Temporary password",
    tournamentAdmin: "Tournament Admin",
    tournamentBracket: "Tournament bracket",
    tournamentComplete: "Tournament complete",
    tournamentDeleted: "Tournament deleted",
    tournamentFormat: "Tournament format",
    tournamentLeadAccounts: "Tournament lead accounts",
    tournamentLeadActions: "Actions",
    tournamentLeadCreated: "Created",
    tournamentLeadRole: "Role",
    tournamentLeadStatus: "Status",
    tournamentManagement: "Tournament management",
    tournamentName: "Tournament name",
    tournamentStats: "Tournament stats",
    tournaments: "Tournaments",
    typeToConfirm: "Type to confirm",
    unableToGenerateTeams: "Unable to generate teams.",
    unableToRefresh: "Unable to refresh",
    unableToSaveTournamentTeams: "Unable to save tournament teams.",
    unableToStartTournament: "Unable to start tournament.",
    unableToUpdateMatch: "Unable to update match",
    upNext: "Up next",
    view: "View",
    volleyballTournaments: "Tournaments",
    winRate: "Win rate",
    won: "Won",
    winnerOnly: "Winner only",
    wins: "Wins",
    yourScore: "Your score",
    accounts: "Accounts",
    admin: "Admin",
    adminNavigation: "Admin navigation",
    allCourtsOccupied: "All courts occupied",
    apiDocsDescription:
      "Interactive documentation generated from the OpenAPI document.",
    apiDocsTitle: "Swagger API Docs",
    assigning: "Assigning...",
    bestOfOne: "Best of 1",
    bracketSelection: "Bracket selection",
    bye: "Bye",
    changing: "Changing...",
    close: "Close",
    closeAdminNavigation: "Close admin navigation",
    closeNavigationMenu: "Close navigation menu",
    confirmMatch: "Confirm match",
    confirmOverride: "Confirm override",
    confirming: "Confirming...",
    configureTournamentDescription:
      "Configure the tournament before entering teams or players.",
    court: "Court",
    courtAssignedMessage: "Court {court} assigned.",
    courtAssignedWithReplacement:
      "Court {court} assigned; previous match returned to ready.",
    courtOverride: "Court override",
    courtOverrideFailed: "Court override failed",
    courtsInUse: "{current}/{total} courts in use",
    createTournamentDescription:
      "Configure the tournament before entering teams or players.",
    createdAccountSignInFailed: "Account created, but sign in failed.",
    creating: "Creating...",
    dashboardOverview: "Dashboard overview",
    dashboardSections: "Dashboard sections",
    dismissError: "Dismiss error",
    dismissTemporaryPassword: "Dismiss temporary password",
    emptyTournamentDescription: "Create one to start scheduling matches.",
    enableJavaScriptApiDocs:
      "Enable JavaScript to view Swagger UI. The OpenAPI JSON is available at /api/openapi.",
    enterAtLeastTwoTeamNames: "Enter at least two team names.",
    enterScores: "Enter scores",
    final: "Final",
    joinedAs: "Joined as {name}",
    joining: "Joining...",
    joinTournament: "Join tournament",
    lbFinal: "LB Final",
    live: "LIVE",
    liveCourt: "Live, court {court}",
    loadingMatch: "Loading match",
    loserBracket: "Loser bracket",
    loserBracketRounds: "Loser bracket rounds",
    manageTournamentLeadsNote:
      "Create tournament leads and reset temporary passwords.",
    markAsInProgress: "Mark as in progress",
    matchCompleted: "{match} was completed.",
    matchConfirmed: "Match confirmed",
    matchInProgress: "{match} is now in progress.",
    matchOverridden: "Match overridden",
    matchWinnerNotDetermined: "Match winner has not been determined",
    mobileNavigation: "Mobile navigation",
    noCompletedMatches: "No completed matches yet.",
    noPlayableEventMatches: "No playable event matches.",
    noPlayersListed: "No players listed",
    openApiJson: "OpenAPI JSON",
    openAdminNavigation: "Open admin navigation",
    openNavigationMenu: "Open navigation menu",
    opponentNameRequired: "Opponent name is required.",
    overrideResult: "Override result",
    pending: "Pending",
    pointsDiff: "Points +/-",
    primaryNavigation: "Primary navigation",
    publicTournamentList: "Public tournament list",
    publicView: "Public View",
    quarterFinal: "Quarter-Final",
    ready: "Ready",
    resetPlayerPassword: "Reset password",
    resetPlayerPasswordAction: "Reset {name} password",
    resultUpdated: "Result updated.",
    resultUpdatedWithDownstreamReset:
      "Result updated and {count} downstream match reset.",
    saveSet: "Save set",
    scoreSaved: "Score saved",
    semiFinal: "Semi-Final",
    set: "Set",
    setSaved: "Set {set} was saved.",
    shuffleTeams: "Shuffle teams",
    signInDescription: "Sign in with your tournament or player account.",
    signUpToJoin: "Sign up to join",
    submitOverride: "Submit override",
    submitting: "Submitting...",
    switchToDarkMode: "Switch to dark mode",
    switchToLightMode: "Switch to light mode",
    teamNameField: "Team {n} name",
    teamPreviewNameField: "Preview team {n} name",
    temporaryPasswordHelp:
      "Share this temporary password. The user must set their own password next.",
    titleOpen: "Title open",
    toBeDetermined: "TBD",
    tournamentLead: "Tournament Lead",
    unableToAssignCourt: "Unable to assign court.",
    unableToChangePassword: "Unable to change password.",
    unableToConfirmMatch: "Unable to confirm match.",
    unableToCreateAdminAccount: "Unable to create admin account.",
    unableToCreatePlayerAccount: "Unable to create player account.",
    unableToCreateTournament: "Unable to create tournament.",
    unableToDeletePracticeMatch: "Unable to delete practice match.",
    unableToDeleteTournament: "Unable to delete tournament.",
    unableToJoinTournament: "Unable to join tournament.",
    unableToLoadTournament: "Unable to load tournament.",
    unableToOverrideMatch: "Unable to override match.",
    unableToRemoveTournamentLead: "Unable to remove tournament lead.",
    unableToResetPlayerPassword: "Unable to reset player password.",
    unableToSavePracticeMatch: "Unable to save practice match.",
    unableToSaveScore: "Unable to save score.",
    unableToSignIn: "Unable to sign in. Please try again.",
    updating: "Updating...",
    versus: "vs",
    viewInBracket: "View in bracket",
    winner: "Winner",
    teamWon: "{team} won",
    winnerBracket: "Winner bracket",
    winnerBracketRounds: "Winner bracket rounds",
    changingWinnerWarning: "Changing the winner will reset downstream matches.",
    playerNameField: "Player {n} name",
    playerRemainderWarning: "Some players will be added to the last team.",
    addParticipantsNote:
      "Add participants and confirm the teams before starting the tournament.",
    completedNonByeMatches: "Completed non-bye matches",
    individualMixer: "Individual mixer",
  },
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "de";
}

export function translate(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.en[key];
}

export function formatTranslation(
  locale: Locale,
  key: TranslationKey,
  values: Record<string, string | number>,
): string {
  return translate(locale, key).replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.prototype.hasOwnProperty.call(values, name)
      ? String(values[name])
      : placeholder,
  );
}
