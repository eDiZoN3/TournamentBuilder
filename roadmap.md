10. Tournament Groups

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
