const sheetId = '1501FsO_lM5K0buhsy9CYlzWnTQl8cwiyrY0I3KU-3qs';
const apiKey = 'AIzaSyDnfg1bUhP6bqIRh-hPN7Juj4ahekZ_cuA';
const range = 'Chandler!A11:K11';

const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    const values = data.values[0];

    // Map values to page
    document.getElementById('prestige-value').textContent = values[0];

    document.getElementById('career-wins').textContent = values[1];
    document.getElementById('career-win-pct').textContent = values[2];
    document.getElementById('career-points').textContent = values[3];
    document.getElementById('career-avg').textContent = values[4];

    document.getElementById('playoff-record').textContent = values[5];
    document.getElementById('playoff-win-pct').textContent = values[6];
    document.getElementById('playoff-byes').textContent = values[7];
    document.getElementById('playoff-points').textContent = values[8];
    document.getElementById('playoff-avg').textContent = values[9];
    document.getElementById('champ-record').textContent = values[10];
  })
  .catch(error => {
    console.error('Error loading data from Google Sheets:', error);
  });
