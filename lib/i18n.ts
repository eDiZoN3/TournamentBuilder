export const LOCALE_STORAGE_KEY = "raro-locale";

export type Locale = "en" | "de";

export type TranslationKey =
  | "account"
  | "active"
  | "addPlayer"
  | "addTeam"
  | "adminLogin"
  | "allowPlayerSelfJoin"
  | "bestOfThree"
  | "completed"
  | "controls"
  | "courtsAvailable"
  | "createAccount"
  | "createNewTournament"
  | "createTournament"
  | "dashboard"
  | "delete"
  | "diff"
  | "doubleElimination"
  | "draft"
  | "edit"
  | "email"
  | "enterPlayerNames"
  | "enterTeamNames"
  | "exactPlayerCountRequirement"
  | "finalStandings"
  | "firstName"
  | "followCurrentTournaments"
  | "globalStats"
  | "generateTeams"
  | "loading"
  | "lost"
  | "individualMixer"
  | "languageSwitchToEnglish"
  | "languageSwitchToGerman"
  | "logOut"
  | "losses"
  | "match"
  | "matches"
  | "manage"
  | "manageVolleyballTournaments"
  | "name"
  | "newTournament"
  | "noPlayerStats"
  | "noPracticeMatches"
  | "noPracticeStats"
  | "noTeamStats"
  | "noTournamentsYet"
  | "oneSetPerMatch"
  | "opponentName"
  | "opponentScore"
  | "password"
  | "place"
  | "played"
  | "player"
  | "playerAccount"
  | "playerSignUp"
  | "playerStats"
  | "practiceMatches"
  | "practicePlayerStats"
  | "practiceStats"
  | "points"
  | "pointsAgainst"
  | "pointsFor"
  | "round"
  | "roundRobinMatchFormat"
  | "saving"
  | "savePracticeMatch"
  | "schedule"
  | "score"
  | "signIn"
  | "signingIn"
  | "signUp"
  | "startTournament"
  | "standings"
  | "stats"
  | "setsWonLost"
  | "status"
  | "setup"
  | "surname"
  | "team"
  | "teamEntry"
  | "teamPreview"
  | "teamRoundRobin"
  | "teams"
  | "teamSize"
  | "teamStats"
  | "tournamentAdmin"
  | "tournamentBracket"
  | "tournamentComplete"
  | "tournamentFormat"
  | "tournamentManagement"
  | "tournamentName"
  | "tournamentStats"
  | "tournaments"
  | "upNext"
  | "view"
  | "volleyballTournaments"
  | "winRate"
  | "won"
  | "wins"
  | "yourScore";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  de: {
    account: "Konto",
    active: "Aktiv",
    addPlayer: "Spieler hinzufugen",
    addTeam: "Team hinzufugen",
    adminLogin: "Admin-Login",
    allowPlayerSelfJoin: "Spielerkonten selbst beitreten lassen",
    bestOfThree: "Best of three",
    completed: "Abgeschlossen",
    controls: "Steuerung",
    courtsAvailable: "Verfügbare Felder",
    createAccount: "Konto erstellen",
    createNewTournament: "Neues Turnier erstellen",
    createTournament: "Turnier erstellen",
    dashboard: "Dashboard",
    delete: "Loeschen",
    diff: "Diff",
    doubleElimination: "Double Elimination",
    draft: "Entwurf",
    edit: "Bearbeiten",
    email: "E-Mail",
    enterPlayerNames: "Spielernamen eingeben",
    enterTeamNames: "Teamnamen eingeben",
    exactPlayerCountRequirement:
      "Spieleranzahl muss durch die Teamgroesse teilbar sein.",
    finalStandings: "Endstand",
    firstName: "Vorname",
    followCurrentTournaments:
      "Aktuelle Turniere verfolgen und abgeschlossene Spiele ansehen.",
    globalStats: "Globale Statistiken",
    generateTeams: "Teams generieren",
    individualMixer: "Einzel-Mixer",
    languageSwitchToEnglish: "Sprache auf Englisch wechseln",
    languageSwitchToGerman: "Sprache auf Deutsch wechseln",
    loading: "Laden",
    logOut: "Abmelden",
    lost: "Verloren",
    losses: "Niederlagen",
    manage: "Verwalten",
    manageVolleyballTournaments: "Turniere verwalten.",
    match: "Spiel",
    matches: "Spiele",
    name: "Name",
    newTournament: "Neues Turnier",
    noPlayerStats: "Noch keine Spielerstatistiken",
    noPracticeMatches: "Noch keine Trainingsspiele",
    noPracticeStats: "Noch keine Trainingsstatistiken",
    noTeamStats: "Noch keine Teamstatistiken",
    noTournamentsYet: "Noch keine Turniere.",
    oneSetPerMatch: "Ein Satz pro Spiel",
    opponentName: "Gegnername",
    opponentScore: "Gegnerpunkte",
    password: "Passwort",
    place: "Platz",
    played: "Gespielt",
    player: "Spieler",
    playerAccount: "Spielerkonto",
    playerSignUp: "Spielerregistrierung",
    playerStats: "Spielerstatistiken",
    practiceMatches: "Trainingsspiele",
    practicePlayerStats: "Trainingsspielerstatistiken",
    practiceStats: "Trainingsstatistiken",
    saving: "Speichern...",
    savePracticeMatch: "Trainingsspiel speichern",
    points: "Punkte",
    pointsAgainst: "Punkte gegen",
    pointsFor: "Punkte für",
    round: "Runde",
    roundRobinMatchFormat: "Round-Robin-Spielformat",
    schedule: "Spielplan",
    score: "Ergebnis",
    signIn: "Anmelden",
    signingIn: "Anmelden...",
    signUp: "Registrieren",
    startTournament: "Turnier starten",
    standings: "Tabelle",
    stats: "Statistiken",
    setsWonLost: "Sätze S-N",
    setup: "Einrichten",
    status: "Status",
    surname: "Nachname",
    team: "Team",
    teamEntry: "Teameingabe",
    teamPreview: "Teamvorschau",
    teamRoundRobin: "Team-Round-Robin",
    teams: "Teams",
    teamSize: "Teamgröße",
    teamStats: "Teamstatistiken",
    tournamentAdmin: "Turnierverwaltung",
    tournamentBracket: "Turnieransicht",
    tournamentComplete: "Turnier abgeschlossen",
    tournamentFormat: "Turnierformat",
    tournamentManagement: "Turnierverwaltung",
    tournamentName: "Turniername",
    tournamentStats: "Turnierstatistiken",
    tournaments: "Turniere",
    upNext: "Als Nachstes",
    view: "Ansehen",
    volleyballTournaments: "Volleyballturniere",
    winRate: "Siegquote",
    won: "Gewonnen",
    wins: "Siege",
    yourScore: "Deine Punkte",
  },
  en: {
    account: "Account",
    active: "Active",
    addPlayer: "Add player",
    addTeam: "Add team",
    adminLogin: "Admin login",
    allowPlayerSelfJoin: "Allow player account self-join",
    bestOfThree: "Best of three",
    completed: "Completed",
    controls: "Controls",
    courtsAvailable: "Courts available",
    createAccount: "Create account",
    createNewTournament: "Create New Tournament",
    createTournament: "Create tournament",
    dashboard: "Dashboard",
    delete: "Delete",
    diff: "Diff",
    doubleElimination: "Double elimination",
    draft: "Draft",
    edit: "Edit",
    email: "Email",
    enterPlayerNames: "Enter player names",
    enterTeamNames: "Enter team names",
    exactPlayerCountRequirement:
      "Player count must be divisible by team size.",
    finalStandings: "Final standings",
    firstName: "First name",
    followCurrentTournaments:
      "Follow current tournaments and review completed brackets.",
    globalStats: "Global stats",
    generateTeams: "Generate teams",
    individualMixer: "Individual mixer",
    languageSwitchToEnglish: "Switch language to English",
    languageSwitchToGerman: "Switch language to German",
    loading: "Loading",
    logOut: "Log out",
    lost: "Lost",
    losses: "Losses",
    manage: "Manage",
    manageVolleyballTournaments: "Manage volleyball tournaments.",
    match: "Match",
    matches: "Matches",
    name: "Name",
    newTournament: "New tournament",
    noPlayerStats: "No player stats yet",
    noPracticeMatches: "No practice matches yet",
    noPracticeStats: "No practice stats yet",
    noTeamStats: "No team stats yet",
    noTournamentsYet: "No tournaments yet.",
    oneSetPerMatch: "One set per match",
    opponentName: "Opponent name",
    opponentScore: "Opponent score",
    password: "Password",
    place: "Place",
    played: "Played",
    player: "Player",
    playerAccount: "Player account",
    playerSignUp: "Player sign up",
    playerStats: "Player stats",
    practiceMatches: "Practice matches",
    practicePlayerStats: "Practice player stats",
    practiceStats: "Practice stats",
    saving: "Saving...",
    savePracticeMatch: "Save practice match",
    points: "Points",
    pointsAgainst: "Points Against",
    pointsFor: "Points For",
    round: "Round",
    roundRobinMatchFormat: "Round-robin match format",
    schedule: "Schedule",
    score: "Score",
    signIn: "Sign in",
    signingIn: "Signing in...",
    signUp: "Sign up",
    startTournament: "Start tournament",
    standings: "Standings",
    stats: "Stats",
    setsWonLost: "Sets W-L",
    setup: "Setup",
    status: "Status",
    surname: "Surname",
    team: "Team",
    teamEntry: "Team entry",
    teamPreview: "Team preview",
    teamRoundRobin: "Team round robin",
    teams: "Teams",
    teamSize: "Team size",
    teamStats: "Team stats",
    tournamentAdmin: "Tournament Admin",
    tournamentBracket: "Tournament bracket",
    tournamentComplete: "Tournament complete",
    tournamentFormat: "Tournament format",
    tournamentManagement: "Tournament management",
    tournamentName: "Tournament name",
    tournamentStats: "Tournament stats",
    tournaments: "Tournaments",
    upNext: "Up next",
    view: "View",
    volleyballTournaments: "Volleyball tournaments",
    winRate: "Win rate",
    won: "Won",
    wins: "Wins",
    yourScore: "Your score",
  },
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "de";
}

export function translate(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.en[key];
}
