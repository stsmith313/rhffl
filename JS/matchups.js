const LEAGUE_ID = '467985'; // Replace with your actual league ID
  const SEASON_ID = 2025;
  const LOCAL_LOGOS = {
        1: "Logos/ridge.png",
        3: "Logos/kevin.png",
        4: "Logos/josiah.png",
        5: "Logos/scott.png",
        10: "Logos/chandler.png",
        12: "Logos/garrett.png",
        13: "Logos/spencer.png",
        16: "Logos/krista.png",
        18: "Logos/gabi.png",
        20: "Logos/joey.png",
        19: "Logos/sam.png",
        15: "Logos/chris.png"
    // Add all your teamId -> logo paths here
  };

  async function getCurrentWeek() {
    try {
      const res = await fetch(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON_ID}/segments/0/leagues/${LEAGUE_ID}`);
      const data = await res.json();
      return data.status?.currentMatchupPeriod || 1;
    } catch (error) {
      console.error('Error fetching current week:', error);
      return 1;
    }
  }

  async function fetchMatchups(leagueId, seasonId, week) {
    const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=mMatchup&view=mTeam&scoringPeriodId=${week}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      const matchups = data.schedule.filter(m => m.matchupPeriodId === week);
      const teams = data.teams;

      const weekLabelEl = document.getElementById('week-label');
      if (weekLabelEl) weekLabelEl.innerText = `Week ${week}`;

      const container = document.getElementById('matchups');
      container.innerHTML = '';

      matchups.forEach(matchup => {
        const home = matchup.home;
        const away = matchup.away;

        const homeTeam = teams.find(t => t.id === home.teamId);
        const awayTeam = teams.find(t => t.id === away.teamId);

        const homeName = homeTeam?.name || 'Unnamed';
        const awayName = awayTeam?.name || 'Unnamed';
        const homeRec = `${homeTeam?.record.overall.wins}-${homeTeam?.record.overall.losses}`;
        const awayRec = `${awayTeam?.record.overall.wins}-${awayTeam?.record.overall.losses}`;
        const homeScore = home.totalPoints.toFixed(2);
        const awayScore = away.totalPoints.toFixed(2);
        const homeProj = home.totalProjectedPoints?.toFixed(2) || '-';
        const awayProj = away.totalProjectedPoints?.toFixed(2) || '-';

        const homeLogo = LOCAL_LOGOS[home.teamId] || homeTeam?.logo;
        const awayLogo = LOCAL_LOGOS[away.teamId] || awayTeam?.logo;

        let homeClass = 'tie';
        let awayClass = 'tie';
        if (+homeScore > +awayScore) {
          homeClass = 'winner';
          awayClass = 'loser';
        } else if (+homeScore < +awayScore) {
          homeClass = 'loser';
          awayClass = 'winner';
        }

        const matchupEl = document.createElement('div');
        matchupEl.className = 'matchup fade-up';
        matchupEl.innerHTML = `
          <div class="team ${awayClass}">
            <img class="team-logo" src="${awayLogo}" alt="${awayName}" />
            <div>
              <div class="team-name">${awayName}</div>
              <div class="record">${awayRec}</div>
            </div>
          </div>
          <div class="score">
            ${awayScore} (${awayProj})<br>
            vs<br>
            ${homeScore} (${homeProj})
          </div>
          <div class="team ${homeClass}">
            <img class="team-logo" src="${homeLogo}" alt="${homeName}" />
            <div>
              <div class="team-name">${homeName}</div>
              <div class="record">${homeRec}</div>
            </div>
          </div>
        `;

        container.appendChild(matchupEl);
      });

    } catch (error) {
      console.error('Error fetching matchups:', error);
      const container = document.getElementById('matchups');
      if (container) container.innerText = 'Error loading matchups.';
    }
  }

  async function loadAndRefreshMatchups() {
    const week = await getCurrentWeek();
    await fetchMatchups(LEAGUE_ID, SEASON_ID, week);
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadAndRefreshMatchups();
  });
