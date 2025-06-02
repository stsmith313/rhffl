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
        score1: parseFloat(row[4]),
        team2: row[7],
        score2: parseFloat(row[6])
    }));
}

function getUniqueTeams(data) {
    const set = new Set();
    data.forEach(m => {
        set.add(m.team1);
        set.add(m.team2);
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

function populateDropdowns(teams) {
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    const options = teams.map(t => `<option value="${t}">${t}</option>`).join('');
    team1Select.innerHTML += options;
    team2Select.innerHTML += options;
}

function renderTable(matchups, team1, team2) {
    if (!team1 || !team2 || team1 === team2) {
        document.getElementById('results').innerHTML = '<p>Please select two different teams.</p>';
        return;
    }

    if (matchups.length === 0) {
        document.getElementById('results').innerHTML = '<p>No matchups found for this pair.</p>';
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

    document.getElementById('results').innerHTML = `
        <h3>${headToHeadTitle}</h3>
        ${streakText ? `<p class="win-streak">${streakText}</p>` : ''}
        <table>
            <thead>
                <tr><th>Year</th><th>Week</th><th>Team 1</th><th>Team 2</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
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
