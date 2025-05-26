async function fetchStandings() {
    const leagueId = 467985;
    const seasonID = new Date().getFullYear();

    const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonID}/segments/0/leagues/${leagueId}?view=mTeam&view=mStandings`;

    // Map team IDs to local logo filenames
    const teamLogoMap = {
        1: "ridge.png",
        3: "kevin.png",
        4: "josiah.png",
        5: "scott.png",
        10: "chandler.png",
        12: "garrett.png",
        13: "spencer.png",
        16: "krista.png",
        18: "gabi.png",
        20: "joey.png",
        19: "sam.png",
        15: "chris.png"
        // Add or update team IDs and filenames here
    };

    try {
        const response = await fetch(url);
        const data = await response.json();

        const divisions = {};
        const divisionMap = {
            2: "East",
            4: "West",
            5: "North",
            6: "South"
        };

        data.teams.forEach(team => {
            const divisionId = team.divisionId;
            const divisionName = divisionMap[divisionId] || `Division ${divisionId}`;
            const record = team.record.overall || { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
            const pf = record.pointsFor.toFixed(1);
            const margin = (record.pointsFor - record.pointsAgainst).toFixed(1);
            const wins = record.wins;
            const losses = record.losses;

            const teamInfo = {
                id: team.id,
                name: team.name + (team.nickname ? " " + team.nickname : ""),
                record: `${wins}-${losses}`,
                pf,
                margin,
                // Use custom mapping for logos:
                logoFile: teamLogoMap[team.id] || "default.png"
            };

            if (!divisions[divisionName]) {
                divisions[divisionName] = [];
            }
            divisions[divisionName].push(teamInfo);
        });

        // Sort teams in each division by wins desc, then points for desc
        Object.values(divisions).forEach(teamList => {
            teamList.sort((a, b) => {
                const [aw] = a.record.split('-').map(Number);
                const [bw] = b.record.split('-').map(Number);
                if (bw !== aw) return bw - aw;
                return parseFloat(b.pf) - parseFloat(a.pf);
            });
        });

        renderStandings(divisions, seasonID);
    } catch (err) {
        console.error("Failed to fetch standings:", err);
    }
}

function renderStandings(divisions, seasonID) {
    const container = document.querySelector('.right-side');
    container.innerHTML = `<h2>${seasonID} Standings</h2>`;

    Object.entries(divisions).forEach(([divisionName, teams]) => {
        const divSection = document.createElement('div');
        divSection.innerHTML = `<h3>${divisionName}</h3><div class="table"></div>`;
        const table = divSection.querySelector('.table');

        teams.forEach((team, i) => {
            const row = document.createElement('div');
            row.classList.add('row');
            if (i === 0) {
                row.classList.add('division-leader');
            }

            row.innerHTML = `
                <div class="column">
                    <span class='num-circle'>${i + 1}</span>
                </div>
                <div class="column">
                    <div class="top">
                        <div class="team-link">
                            <img src="Logos/${team.logoFile}" alt="${team.name} Logo" class="standing-img" 
                                 onerror="this.onerror=null;this.src='Logos/default.png';" />
                            <span class="team-name">${team.name}</span>
                        </div>
                    </div>
                    <div class="bottom">
                        <small>PF: ${team.pf}</small>
                        <small>Margin: ${team.margin}</small>
                    </div>
                </div>
                <div class="column">
                    <span>${team.record}</span>
                </div>
            `;
            table.appendChild(row);
        });

        container.appendChild(divSection);
    });
}

fetchStandings();