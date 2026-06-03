export const LOCALE_STORAGE_KEY = "raro-locale";

export type Locale = "en" | "de";

export type TranslationKey =
  | "account"
  | "active"
  | "addPlayer"
  | "addTeam"
  | "adminLogin"
  | "completed"
  | "controls"
  | "courtsAvailable"
  | "createAccount"
  | "createNewTournament"
  | "createTournament"
  | "dashboard"
  | "diff"
  | "doubleElimination"
  | "draft"
  | "email"
  | "enterPlayerNames"
  | "enterTeamNames"
  | "finalStandings"
  | "firstName"
  | "followCurrentTournaments"
  | "globalStats"
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
  | "noTeamStats"
  | "noTournamentsYet"
  | "password"
  | "place"
  | "played"
  | "player"
  | "playerAccount"
  | "playerSignUp"
  | "playerStats"
  | "points"
  | "pointsAgainst"
  | "pointsFor"
  | "round"
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
  | "tournaments"
  | "upNext"
  | "view"
  | "volleyballTournaments"
  | "winRate"
  | "won"
  | "wins";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  de: {
    account: "Konto",
    active: "Aktiv",
    addPlayer: "Spieler hinzufugen",
    addTeam: "Team hinzufugen",
    adminLogin: "Admin-Login",
    completed: "Abgeschlossen",
    controls: "Steuerung",
    courtsAvailable: "Verfugbare Felder",
    createAccount: "Konto erstellen",
    createNewTournament: "Neues Turnier erstellen",
    createTournament: "Turnier erstellen",
    dashboard: "Dashboard",
    diff: "Diff",
    doubleElimination: "Double Elimination",
    draft: "Entwurf",
    email: "E-Mail",
    enterPlayerNames: "Spielernamen eingeben",
    enterTeamNames: "Teamnamen eingeben",
    finalStandings: "Endstand",
    firstName: "Vorname",
    followCurrentTournaments:
      "Aktuelle Turniere verfolgen und abgeschlossene Spielplaene ansehen.",
    globalStats: "Globale Statistiken",
    individualMixer: "Einzel-Mixer",
    languageSwitchToEnglish: "Sprache auf Englisch wechseln",
    languageSwitchToGerman: "Sprache auf Deutsch wechseln",
    loading: "Laden",
    logOut: "Abmelden",
    lost: "Verloren",
    losses: "Niederlagen",
    manage: "Verwalten",
    manageVolleyballTournaments: "Volleyballturniere verwalten.",
    match: "Spiel",
    matches: "Spiele",
    name: "Name",
    newTournament: "Neues Turnier",
    noPlayerStats: "Noch keine Spielerstatistiken",
    noTeamStats: "Noch keine Teamstatistiken",
    noTournamentsYet: "Noch keine Turniere.",
    password: "Passwort",
    place: "Platz",
    played: "Gespielt",
    player: "Spieler",
    playerAccount: "Spielerkonto",
    playerSignUp: "Spielerregistrierung",
    playerStats: "Spielerstatistiken",
    points: "Punkte",
    pointsAgainst: "Punkte gegen",
    pointsFor: "Punkte fur",
    round: "Runde",
    schedule: "Spielplan",
    score: "Ergebnis",
    signIn: "Anmelden",
    signingIn: "Anmelden...",
    signUp: "Registrieren",
    startTournament: "Turnier starten",
    standings: "Tabelle",
    stats: "Statistiken",
    setsWonLost: "Saetze S-N",
    setup: "Einrichten",
    status: "Status",
    surname: "Nachname",
    team: "Team",
    teamRoundRobin: "Team-Rundenturnier",
    teams: "Teams",
    teamSize: "Teamgroesse",
    teamStats: "Teamstatistiken",
    tournamentAdmin: "Turnierverwaltung",
    tournamentBracket: "Turnieransicht",
    tournamentComplete: "Turnier abgeschlossen",
    tournamentFormat: "Turnierformat",
    tournamentManagement: "Turnierverwaltung",
    tournamentName: "Turniername",
    tournaments: "Turniere",
    upNext: "Als Nachstes",
    view: "Ansehen",
    volleyballTournaments: "Volleyballturniere",
    winRate: "Siegquote",
    won: "Gewonnen",
    wins: "Siege",
  },
  en: {
    account: "Account",
    active: "Active",
    addPlayer: "Add player",
    addTeam: "Add team",
    adminLogin: "Admin login",
    completed: "Completed",
    controls: "Controls",
    courtsAvailable: "Courts available",
    createAccount: "Create account",
    createNewTournament: "Create New Tournament",
    createTournament: "Create tournament",
    dashboard: "Dashboard",
    diff: "Diff",
    doubleElimination: "Double elimination",
    draft: "Draft",
    email: "Email",
    enterPlayerNames: "Enter player names",
    enterTeamNames: "Enter team names",
    finalStandings: "Final standings",
    firstName: "First name",
    followCurrentTournaments:
      "Follow current tournaments and review completed brackets.",
    globalStats: "Global stats",
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
    noTeamStats: "No team stats yet",
    noTournamentsYet: "No tournaments yet.",
    password: "Password",
    place: "Place",
    played: "Played",
    player: "Player",
    playerAccount: "Player account",
    playerSignUp: "Player sign up",
    playerStats: "Player stats",
    points: "Points",
    pointsAgainst: "Points Against",
    pointsFor: "Points For",
    round: "Round",
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
    tournaments: "Tournaments",
    upNext: "Up next",
    view: "View",
    volleyballTournaments: "Volleyball tournaments",
    winRate: "Win rate",
    won: "Won",
    wins: "Wins",
  },
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "de";
}

export function translate(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.en[key];
}
