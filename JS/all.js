const API_KEY = 'AIzaSyDnfg1bUhP6bqIRh-hPN7Juj4ahekZ_cuA';
const SHEET_ID = '10vYhURDv_cc1ovJypjiZHTzWHyTvX-1eQdcQy-BvZvM';
const RANGE = 'Game Logs!A2:H';

let allMatchups = [];

async function fetchMatchups() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.values) return [];

  return data.values.map(row => ({
    game: row[0],
    year: parseInt(row[1]),
    week: parseInt(row[2]),
    team1: row[3],
    score1: parseFloat(row[4]) || 0,
    score2: parseFloat(row[6]) || 0,
    team2: row[7]
  }));
}

function getUniqueTeams(data) {
  const set = new Set();
  data.forEach(m => {
    if(m.team1) set.add(m.team1);
    if(m.team2) set.add(m.team2);
  });
  return [...set].sort();
}

function filterMatchups(team1, team2) {
  return allMatchups.filter(m =>
    (m.team1 === team1 && m.team2 === team2) ||
    (m.team1 === team2 && m.team2 === team1)
  );
}

function getHeadToHeadRecord(matchups, team1, team2) {
  let team1Wins = 0;
  let team2Wins = 0;

  matchups.forEach(m => {
    if (m.team1 === team1 && m.team2 === team2) {
      if (m.score1 > m.score2) team1Wins++;
      else if (m.score2 > m.score1) team2Wins++;
    } else if (m.team1 === team2 && m.team2 === team1) {
      if (m.score1 > m.score2) team2Wins++;
      else if (m.score2 > m.score1) team1Wins++;
    }
  });

  return { team1Wins, team2Wins };
}

function getWinStreak(matchups, team1, team2) {
  const sorted = [...matchups].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.week - a.week;
  });

  let streakTeam = null;
  let streakCount = 0;

  for (let m of sorted) {
    let winner = null;
    if (m.team1 === team1 && m.team2 === team2) {
      winner = m.score1 > m.score2 ? team1 : m.score2 > m.score1 ? team2 : null;
    } else if (m.team1 === team2 && m.team2 === team1) {
      winner = m.score1 > m.score2 ? team2 : m.score2 > m.score1 ? team1 : null;
    }

    if (!winner) continue;

    if (streakTeam === null) {
      streakTeam = winner;
      streakCount = 1;
    } else if (winner === streakTeam) {
      streakCount++;
    } else {
      break;
    }
  }

  return streakCount > 1 ? `${streakTeam} is on a ${streakCount}-game win streak` : '';
}

function getAllTimeStats(team, data) {
  const games = data.filter(m =>
    (m.team1 === team || m.team2 === team) &&
    !isNaN(m.score1) && !isNaN(m.score2)
  );

  let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0;

  games.forEach(m => {
    const isTeam1 = m.team1 === team;
    const myScore = isTeam1 ? parseFloat(m.score1) : parseFloat(m.score2);
    const oppScore = isTeam1 ? parseFloat(m.score2) : parseFloat(m.score1);

    if (isNaN(myScore) || isNaN(oppScore)) return;

    pf += myScore;
    pa += oppScore;

    if (myScore > oppScore) wins++;
    else if (oppScore > myScore) losses++;
    else ties++;
  });

  const totalGames = wins + losses + ties;
  const ppg = totalGames > 0 ? (pf / totalGames).toFixed(2) : "0.00";

  return { wins, losses, ties, pf: pf.toFixed(2), pa: pa.toFixed(2), ppg };
}

function renderTable(matchups, team1, team2) {
  const resultsDiv = document.getElementById('results');

  if (!team1 || !team2 || team1 === team2) {
    resultsDiv.innerHTML = '<p>Please select two different teams.</p>';
    clearTeamStats();
    clearChart();
    return;
  }

  if (matchups.length === 0) {
    resultsDiv.innerHTML = '<p>No matchups found for this pair.</p>';
    clearTeamStats();
    clearChart();
    return;
  }

  const { team1Wins, team2Wins } = getHeadToHeadRecord(matchups, team1, team2);
  const streakText = getWinStreak(matchups, team1, team2);

  const headToHeadTitle = `${team1} vs ${team2} — Series: ${team1Wins}-${team2Wins}`;

  const rows = matchups.map(m => {
    const t1Winner = m.score1 > m.score2;
    const t2Winner = m.score2 > m.score1;

    return `
      <tr>
        <td>${m.year}</td>
        <td>${m.week}</td>
        <td class="${t1Winner ? 'winner' : 'loser'}">${m.team1} (${m.score1})</td>
        <td class="${t2Winner ? 'winner' : 'loser'}">${m.team2} (${m.score2})</td>
      </tr>
    `;
  }).join('');

  resultsDiv.innerHTML = `
    <h3>${headToHeadTitle}</h3>
    ${streakText ? `<p class="win-streak">${streakText}</p>` : ''}
    <table>
      <thead>
        <tr><th>Year</th><th>Week</th><th>Team 1</th><th>Team 2</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  renderTeamStats(team1, team2);
  renderTrendChart(matchups, team1, team2);
}

function renderTeamStats(team1, team2) {
  const stats1 = getAllTimeStats(team1, allMatchups);
  const stats2 = getAllTimeStats(team2, allMatchups);

  function compareStat(stat, isHigherBetter = true) {
    const val1 = parseFloat(stats1[stat]);
    const val2 = parseFloat(stats2[stat]);
    
    const highlight1 = (isHigherBetter ? val1 > val2 : val1 < val2) ? 'highlight' : '';
    const highlight2 = (isHigherBetter ? val2 > val1 : val2 < val1) ? 'highlight' : '';

    return { highlight1, highlight2 };
  }

  const w = compareStat('wins');
  const l = compareStat('losses', false); // lower losses is better
  const t = compareStat('ties'); // optional, up to you if you want to highlight this
  const pf = compareStat('pf');
  const pa = compareStat('pa', false); // lower PA is better
  const ppg = compareStat('ppg');

  document.getElementById('team1-stats').innerHTML = `
    <h3>${team1} - All Time Stats</h3>
    <p class="${w.highlight1}">Wins: ${stats1.wins}</p>
    <p class="${l.highlight1}">Losses: ${stats1.losses}</p>
    <p class="${t.highlight1}">Ties: ${stats1.ties}</p>
    <p class="${pf.highlight1}">Points For (PF): ${stats1.pf}</p>
    <p class="${pa.highlight1}">Points Against (PA): ${stats1.pa}</p>
    <p class="${ppg.highlight1}">Points Per Game (PPG): ${stats1.ppg}</p>
  `;

  document.getElementById('team2-stats').innerHTML = `
    <h3>${team2} - All Time Stats</h3>
    <p class="${w.highlight2}">Wins: ${stats2.wins}</p>
    <p class="${l.highlight2}">Losses: ${stats2.losses}</p>
    <p class="${t.highlight2}">Ties: ${stats2.ties}</p>
    <p class="${pf.highlight2}">Points For (PF): ${stats2.pf}</p>
    <p class="${pa.highlight2}">Points Against (PA): ${stats2.pa}</p>
    <p class="${ppg.highlight2}">Points Per Game (PPG): ${stats2.ppg}</p>
  `;
}


function clearTeamStats() {
  document.getElementById('team1-stats').innerHTML = '';
  document.getElementById('team2-stats').innerHTML = '';
}

let chart = null;

function renderTrendChart(matchups, team1, team2) {
  const sorted = [...matchups].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.week - b.week;
  });

  const labels = sorted.map(m => `${m.year} Wk${m.week}`);

  const team1Points = [];
  const team2Points = [];
  const tooltips = [];

  sorted.forEach(m => {
    let t1Score, t2Score;
    if (m.team1 === team1 && m.team2 === team2) {
      t1Score = m.score1;
      t2Score = m.score2;
    } else {
      t1Score = m.score2;
      t2Score = m.score1;
    }

    team1Points.push(t1Score);
    team2Points.push(t2Score);
    tooltips.push(`${m.team1} ${m.score1} - ${m.score2} ${m.team2} (${m.year} Wk${m.week})`);
  });

  const ctx = document.getElementById('trendChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: team1,
          data: team1Points,
          borderColor: '#008000',
          backgroundColor: 'rgba(0, 128, 0, 0.3)',
          fill: false,
          tension: 0.1
        },
        {
          label: team2,
          data: team2Points,
          borderColor: '#DC143C',
          backgroundColor: 'rgba(220, 20, 60, 0.3)',
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function(context) {
              const idx = context[0].dataIndex;
              return tooltips[idx];
            },
            label: function(context) {
              return `${context.dataset.label}: ${context.formattedValue}`;
            }
          }
        },
        legend: {
          labels: { color: '#ddddd' }
        },
        title: {
          display: true,
          text: 'Points Trend Per Matchup',
          color: '#ddddd',
          font: { size: 20 }
        }
      },
      scales: {
        x: {
          ticks: { color: '#000000' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#000000' }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const match = sorted[index];
          const selector = `[data-match='${match.year}-W${match.week}']`;
          const row = document.querySelector(selector);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 1500);
          }
        }
      }
    }
  });
}



function clearChart() {
  if(chart){
    chart.destroy();
    chart = null;
  }
}

function populateDropdowns(teams) {
  const team1Select = document.getElementById('team1');
  const team2Select = document.getElementById('team2');
  const options = teams.map(t => `<option value="${t}">${t}</option>`).join('');
  team1Select.innerHTML += options;
  team2Select.innerHTML += options;
}

async function init() {
  allMatchups = await fetchMatchups();
  const teams = getUniqueTeams(allMatchups);
  populateDropdowns(teams);

  const team1Select = document.getElementById('team1');
  const team2Select = document.getElementById('team2');

  function handleSelectionChange() {
    const t1 = team1Select.value;
    const t2 = team2Select.value;
    const filtered = filterMatchups(t1, t2);
    renderTable(filtered, t1, t2);
  }

  team1Select.addEventListener('change', handleSelectionChange);
  team2Select.addEventListener('change', handleSelectionChange);
}

init();