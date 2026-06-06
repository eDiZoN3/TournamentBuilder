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
20. need to allow in team round robin to enter only playernames and generate the teams that are playing by random. can only work if the playercount is player % teamsize = 0, it of course then need to support self join from player accounts but starting the tournament is prohibited until the correct amount of players with the constriction before ist fullfilled. for round robin default is 1 set per match, but can be changed to bo3
21. [implemented] the matchtables active row is in manage view off (the active and completed rounds columns are less wide then every other round, should be the same size the whole table) and in the public view the active rows columns are not the same size as the non active rows, do not mark them like this but mark them with light green background as indicator this is the ongoing round, same is in admin view, the wideness of each column should be fixed size in % this way every coloumn should be the exact same wideness
22. [implemented] sign in card is off, should be on the same distanze from the navbar then the signup card
23. [implemented] if only one court is available i want the button mark as in progress mark it and do not show the assign court button, is uselss when only 1 court is available
