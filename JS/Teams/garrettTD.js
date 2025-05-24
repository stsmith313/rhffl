async function fetchTeamData() {
    const leagueId = '467985';
    const seasonId = '2025';
    const teamId = 12;
    const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=mSettings&view=mTeam&view=modular&view=mNav`;

    const divisionNames = {
        1: "West",
        2: "East",
        3: "South",
        4: "West",
        5: "North",
        6: "South"
    };

    // Helper to get ordinal suffix for place: 1 → 1st, 2 → 2nd, etc.
    function getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Find the team object
        const team = data.teams.find(t => t.id === teamId);
        const owner = data.members.find(m => m.id === team.owners[0]);

        // Filter teams in the same division
        const divisionTeams = data.teams.filter(t => t.divisionId === team.divisionId);

        // Sort teams in division by wins descending, then by pointsFor descending (tiebreaker)
        divisionTeams.sort((a, b) => {
            if (b.record.overall.wins !== a.record.overall.wins) {
                return b.record.overall.wins - a.record.overall.wins;
            }
            return b.record.overall.pointsFor - a.record.overall.pointsFor;
        });

        // Find the team's place (1-based index)
        const place = divisionTeams.findIndex(t => t.id === teamId) + 1;

        // Update the DOM elements
        document.getElementById("team-name").innerText = `${team.name}`;
        document.getElementById("team-owner").innerText = `${owner.firstName} ${owner.lastName}`;
        document.getElementById("team-record").innerText = `${team.record.overall.wins} - ${team.record.overall.losses}`;
        const winPct = ((team.record.overall.wins / (team.record.overall.wins + team.record.overall.losses)) * 100).toFixed(1);
        document.getElementById("team-win-pct").innerText = `${winPct}%`;
        document.getElementById("team-points").innerText = team.record.overall.pointsFor.toLocaleString(1);

        const divisionName = divisionNames[team.divisionId] || `Division ${team.divisionId}`;
        document.getElementById("team-standing").innerText = `${getOrdinal(place)} ${divisionName}`;

    } catch (error) {
        console.error("Failed to fetch team data:", error);
    }
}

fetchTeamData();
