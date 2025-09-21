// Populate drop down
const select = document.getElementById("gameweek-select");

async function getMatches(gameweek, leagueDetails) {
    console.log(leagueDetails)
    let matches = leagueDetails["matches"].filter(m => m["event"] == gameweek);
    return { "matches": matches, "league_entries": leagueDetails["league_entries"] };
}

function populateMatchesTable(leagueDetails, gameweek) {

    getMatches(gameweek, leagueDetails).then(data => {
        console.log(data)
        let matches = data["matches"];
        let leagueEntries = data["league_entries"];
        let table = document.getElementById("matches-table").getElementsByTagName('tbody')[0];
        table.innerHTML = "";
        for (let match of matches) {
            let row = table.insertRow();
            let team1 = leagueEntries.find(entry => entry.id === match.league_entry_1);
            let team2 = leagueEntries.find(entry => entry.id === match.league_entry_2);
            row.insertCell(0).innerHTML = team1 ? (team1.entry_name || "AVERAGE") : "Unknown";
            row.insertCell(1).innerHTML = match.league_entry_1_points;
            row.insertCell(2).innerHTML = match.league_entry_2_points;
            row.insertCell(3).innerHTML = team2 ? (team2.entry_name || "AVERAGE") : "Unknown";
        }
        makeRowsClickable();
    });

};

// Handle table rows clicks
function my_function(rowData) {
    populateTeamSheet(rowData.home_team, "left");
    populateTeamSheet(rowData.away_team, "right");
}

function makeRowsClickable() {

    // Add click handlers to table rows
    document.querySelectorAll('.clickable tbody tr').forEach(row => {
        // Add hover effects
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.01)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });

        // Add click handler
        row.addEventListener('click', function() {
            const cells = this.querySelectorAll('td');
            const rowData = {
                home_team: cells[0].textContent.trim(),
                home_points: cells[1].textContent.trim(),
                away_points: cells[2].textContent.trim(),
                away_team: cells[3].textContent.trim(),
            };
            my_function(rowData, );
        });
    });
}
// TODO: Implement this so you can see the formation
function populateTeamSheet(teamId, side) {
    let team_sheet_div = document.getElementById(`${side}-team-sheet`);
    team_sheet_div.innerHTML = "";

    let h3 = document.createElement("h3");
    h3.innerText = teamId;
    team_sheet_div.appendChild(h3);

    leagueEntries = LEAGUE_DETAILS["league_entries"];
    let team = leagueEntries.find(entry => entry.entry_name === teamId);
    let entry_id = team.entry_id;

    let total_points = 0
    
    getLineup(entry_id, CURRENT_GW).then(lineup => {
        console.log(lineup);
        let table = document.createElement("table");
        table.classList.add("modern-table");
        let thead = document.createElement("thead");
        let headerRow = document.createElement("tr");
        ["Position", "Player", "Points", "Minutes"].forEach(headerText => {
            let th = document.createElement("th");
            th.innerText = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        let tbody = document.createElement("tbody");
        getSeasonStats().then(seasonStats => {
            getLiveStats(CURRENT_GW).then(stats => {
                let i = 0;
                lineup.forEach(player => {
                    gameweekStatsPlayer = stats[player["element"]]["stats"];
                    seasonStatsPlayer = seasonStats["elements"].find(e => e.id === player["element"]);
                    let row = document.createElement("tr");
                    let positionCell = document.createElement("td");
                    let position = "";
                    switch (seasonStatsPlayer.element_type) {
                        case 1:
                            position = "GK";
                            break;
                        case 2:
                            position = "DEF";
                            break;
                        case 3:
                            position = "MID";
                            break;
                        case 4:
                            position = "FWD";
                            break;
                    }
                    positionCell.innerText = position;
                    row.appendChild(positionCell);

                    let nameCell = document.createElement("td");
                    nameCell.innerText = seasonStatsPlayer.web_name;
                    row.appendChild(nameCell);

                    let pointsCell = document.createElement("td");
                    pointsCell.innerText = gameweekStatsPlayer.total_points || 0;
                    row.appendChild(pointsCell);

                    let minutesCell = document.createElement("td");
                    minutesCell.innerText = gameweekStatsPlayer.minutes || 0;
                    row.appendChild(minutesCell);

                    tbody.appendChild(row);
                    if (i < 11) {
                        total_points += gameweekStatsPlayer.total_points;
                        h3.innerText = teamId + ` - ${total_points} pts`;
                    }
                    i += 1;
                    if (i == 11) {
                        let subHeaderRow = document.createElement("tr");
                        let subHeaderCell = document.createElement("td");
                        subHeaderCell.colSpan = 4;
                        subHeaderCell.style.textAlign = "center";
                        subHeaderCell.style.fontWeight = "bold";
                        subHeaderCell.innerText = "Substitutes";
                        subHeaderRow.appendChild(subHeaderCell);
                        tbody.appendChild(subHeaderRow);
                    }
                });

            });
            table.appendChild(tbody);
            team_sheet_div.appendChild(table);
        });
    });
}

// Populate dropdown
for (let i = 2; i <= 38; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.text = `Gameweek ${i}`;
    select.appendChild(option);
}

getLeagueDetails().then(data => {
    LEAGUE_DETAILS = data;
    if (sessionStorage.getItem('currentGW')) {
        CURRENT_GW = parseInt(sessionStorage.getItem('currentGW'));
    }
    select.value = CURRENT_GW;
    populateMatchesTable(LEAGUE_DETAILS, CURRENT_GW);
});

select.addEventListener("change", function() {
    CURRENT_GW = this.value;
    if (LEAGUE_DETAILS != null) {
        populateMatchesTable(LEAGUE_DETAILS, CURRENT_GW);
    } else {
        getLeagueDetails().then(data => {
            LEAGUE_DETAILS = data;
            populateMatchesTable(LEAGUE_DETAILS, CURRENT_GW);
        });
    }
});

let t = document.getElementById("matches-table");
console.log(t.rows[0])


