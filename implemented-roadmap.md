1. [implemented] admin feature to add new admin accounts to create, first time login on new admin account with simple random generated password 10 chars and then the prompt to change it to a self set password from the admin
2. [implemented] future player accounts to track own stats, enter tournament on your own that are available, needs setting in tournament creation of admin to make it self joinable with accounts from players. ongoing tournaments can not be joined anymore, but in join phase either players are entered or player can join on their own. saved player data contains name, evt surname, hashedpassword, username/email, player accounts can be created by themselves als sign up, own name/account in tournament should be highlighted and easy visible for the player
3. [implemented] dark mode (switchable)
4. [implemented] admin dashboard with : registered player, registered admins, registered tournament, sum played matches, player registration, abbility to reset password of player accounts
5. [implemented] support for not only ko phase tournaments -> everyone(individual) vs everyone(individual) with new teams each match, each team vs each team, winner is team or indivual with most wins, decided by points if same amount of wins
6. [implemented] add german translation to frontend, can be toggled like dark mode but requires reload probably?
7. [implemented] feature for each players to create little matches on their own that do not belong to any tournament so they can enter pratice matches that count to their personal stats, but are seperated from tournament matches. overall stats should then show the personal stats of player and their match stats seperate in two tables.
8. [implemented] add swagger api documentation
9. [implemented] support for ko phase tournaments without looser bracket and random generation of matches disabled for custom made matches with predefined starting rounds. means that i want a button that switches between matchup of entered teams at random or per hand, (when per hand, team 1 plays team 2, team 3 plays team 4, etc. if team count is not suitable for clean tournament ko graph the last ones get the bye rounds.) so i need double elimination with 2 option, either with looser bracket or without. add the possibility to not enter points and just mark a team as winner, this should also be a config switch in tournamen creation with defaulting to points, but when unchecked it just gets enterd which team won without points. if it is a tournament without points there is no Bo3 needed.
10. [implemented]Tournament Groups

A tournament group is a top-level container that runs N parallel single-elimination tournaments (called categories) using the same pool of teams. Primary use case: the same set of teams competes across multiple categories (e.g. 5 volleyball disciplines) as time-efficiently as possible.

Setup:
- Admin creates a tournament group with a name and adds all participating teams once.
- Admin adds N categories to the group (e.g. "Category A", "Category B", ...). Categories are ordered and their order defines scheduling priority (Category A is higher priority than Category B).
- All teams are automatically enrolled in every category.
- Each category independently generates its own single-elimination bracket (no loser bracket).
- The group is fully separate from standalone tournaments; its data and stats do not mix with any other tournament.

Court model:
- Each category has exactly one court. There is no court assignment UI within a group.
- At most N matches (one per category) can be active at the same time.

Auto-scheduling:
- When the group is started, the system immediately sets the first ready match in each category to in_progress, subject to the team-conflict constraint below.
- Constraint: a team may never be in two active matches simultaneously across any category.
- After every match result is submitted, the system re-evaluates all categories:
  - For the category whose match just completed: find the next ready match in that category where neither team is currently active in any other category; start it automatically. If both teams are currently occupied, leave the category idle and re-check when the next match anywhere in the group finishes.
  - Also re-check any category that was previously idle because of a conflict — it may now be unblocked by the completed match.
- Priority tie-breaking: when multiple categories could each start a new match at the same time, the lower-indexed (higher-priority) category's match is started first.
- There are no manual "mark as in progress" buttons within a tournament group. The system controls all match activation.

Score entry:
- An admin enters scores for any currently active match via the same score-entry UI as standalone tournaments.
- After the winner is recorded, the auto-scheduler runs immediately to start the next match(es).

Group overview (live view):
- Shows each category with its currently active match and the next queued match (the match that will start as soon as a team becomes free).
- Idle categories (waiting for a team conflict to resolve) are clearly indicated.

Group leaderboard:
- Displayed once all matches in all categories have been completed.
- Each team receives a placement score per category (1st place = 1 point, 2nd = 2, 3rd = 3, etc.; lower is better).
- Final ranking is the sum of placement scores across all categories. The team with the lowest total wins.
- Ties are broken by total match wins across all categories.
- The leaderboard is only visible within the group and does not affect global or standalone tournament stats.
