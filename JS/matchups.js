const LEAGUE_ID = "467985";
const SEASON_ID = 2025;
const REFRESH_INTERVAL = 60 * 1000; // 1 minute

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
  15: "Logos/chris.png",
};

let currentWeek = 10; // <-- Force starting week here

// --- Fetch and render matchups ---
async function fetchMatchups(leagueId, seasonId, week) {
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=mMatchup&view=mTeam&scoringPeriodId=${week}`;
  const container = document.getElementById("matchups");
  container.classList.add("fade-out");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch data");

    const data = await response.json();
    const matchups = data.schedule.filter((m) => m.matchupPeriodId === week);
    const teams = data.teams;

    await new Promise((resolve) => setTimeout(resolve, 30)); // fade delay

    // Update week label
    const weekLabelEl = document.getElementById("week-label");
    if (weekLabelEl) weekLabelEl.innerText = `Week ${week}`;

    // Clear old matchups
    container.innerHTML = "";

    // Build matchup cards
    matchups.forEach((matchup) => {
      const home = matchup.home;
      const away = matchup.away;

      const homeTeam = teams.find((t) => t.id === home.teamId);
      const awayTeam = teams.find((t) => t.id === away.teamId);

      const homeName = homeTeam?.name || "Unnamed";
      const awayName = awayTeam?.name || "Unnamed";

      const homeRec = `${homeTeam?.record?.overall?.wins ?? 0}-${
        homeTeam?.record?.overall?.losses ?? 0
      }`;
      const awayRec = `${awayTeam?.record?.overall?.wins ?? 0}-${
        awayTeam?.record?.overall?.losses ?? 0
      }`;

      const homeScore = (
        home.rosterForCurrentScoringPeriod?.appliedStatTotal ?? 0
      ).toFixed(2);
      const awayScore = (
        away.rosterForCurrentScoringPeriod?.appliedStatTotal ?? 0
      ).toFixed(2);

      const homeLogo = LOCAL_LOGOS[home.teamId] || homeTeam?.logo;
      const awayLogo = LOCAL_LOGOS[away.teamId] || awayTeam?.logo;

      let homeClass = "tie";
      let awayClass = "tie";
      if (+homeScore > +awayScore) {
        homeClass = "winner";
        awayClass = "loser";
      } else if (+homeScore < +awayScore) {
        homeClass = "loser";
        awayClass = "winner";
      }

      const matchupEl = document.createElement("div");
      matchupEl.className = "matchup fade-up";
      matchupEl.innerHTML = `
        <div class="team ${awayClass}">
          <img class="team-logo" src="${awayLogo}" alt="${awayName}" />
          <div>
            <div class="team-name">${awayName}</div>
            <div class="record">${awayRec}</div>
          </div>
        </div>
        <div class="score">
          ${awayScore} <br>vs<br> ${homeScore} <br>
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

    container.classList.remove("fade-out");
    container.classList.add("fade-in");
    setTimeout(() => container.classList.remove("fade-in"), 300);
  } catch (err) {
    console.error("Error fetching matchups:", err);
    container.innerText = "Error loading matchups.";
    container.classList.remove("fade-out");
  }
}

// --- Load matchups for current week ---
async function loadMatchups() {
  await fetchMatchups(LEAGUE_ID, SEASON_ID, currentWeek);
}

// --- Change week via arrows ---
async function changeWeek(delta) {
  currentWeek += delta;
  if (currentWeek < 1) currentWeek = 1;
  if (currentWeek > 14) currentWeek = 14;
  await loadMatchups();
}

// --- Initialize ---
document.addEventListener("DOMContentLoaded", async () => {
  await loadMatchups();                 // Load forced week
  setInterval(loadMatchups, REFRESH_INTERVAL); // Auto-refresh

  document.getElementById("prev-week").addEventListener("click", () => changeWeek(-1));
  document.getElementById("next-week").addEventListener("click", () => changeWeek(1));
});
