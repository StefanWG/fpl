getLeagueDetails().then(async data => {
    let matches = data["matches"];
    let standings = {};
    
    // Safely determine CURRENT_GW from matches
    let latestFinishedGW = 1;
    let inProgressGW = null;

    for (let match of matches) {
        if (match["finished"]) {
            latestFinishedGW = Math.max(latestFinishedGW, match["event"]);
        } else {
            // If there's an unfinished match, its event could be active right now
            inProgressGW = match["event"];
            break; // No need to check further once we find an in-progress gameweek
        }
    }

    // Logic: In-progress gameweek first, otherwise the most recent finished gameweek
    CURRENT_GW = inProgressGW !== null ? inProgressGW : latestFinishedGW;

    // Process Standings Data
    for (let match of matches) {
        if (!match["finished"]) continue;
        if (!(match["league_entry_1"] in standings)) {
            standings[match["league_entry_1"]] = { "total_points": 0, "won": 0, "drawn": 0, "lost": 0, "GF": 0, "GA": 0 };
        }
        if (!(match["league_entry_2"] in standings)) {
            standings[match["league_entry_2"]] = { "total_points": 0, "won": 0, "drawn": 0, "lost": 0, "GF": 0, "GA": 0 };
        }
        standings[match["league_entry_1"]]["GF"] += match["league_entry_1_points"];
        standings[match["league_entry_1"]]["GA"] += match["league_entry_2_points"];
        standings[match["league_entry_2"]]["GF"] += match["league_entry_2_points"];
        standings[match["league_entry_2"]]["GA"] += match["league_entry_1_points"];
        if (match["league_entry_1_points"] > match["league_entry_2_points"]) {
            standings[match["league_entry_1"]]["won"] += 1;
            standings[match["league_entry_2"]]["lost"] += 1;
            standings[match["league_entry_1"]]["total_points"] += 3;
        } else if (match["league_entry_1_points"] < match["league_entry_2_points"]) {
            standings[match["league_entry_2"]]["won"] += 1;
            standings[match["league_entry_1"]]["lost"] += 1;
            standings[match["league_entry_2"]]["total_points"] += 3;
        } else {
            standings[match["league_entry_1"]]["drawn"] += 1;
            standings[match["league_entry_2"]]["drawn"] += 1;
            standings[match["league_entry_1"]]["total_points"] += 1;
            standings[match["league_entry_2"]]["total_points"] += 1;
        }
    }
    
    let standings_ = [];
    for (let team in standings) {
        standings_.push({ "id": team, ...standings[team] });
    }
    standings_.sort((a, b) => b["total_points"] - a["total_points"] || (b["GF"] - a["GF"]));
    
    let standings_table = document.getElementById("standings").getElementsByTagName('tbody')[0];
    for (let team of standings_) {
        let row = standings_table.insertRow();
        let found = false;
        for (let entry of data["league_entries"]) {
            if (entry["id"] == team["id"]) {
                if (entry["entry_name"] == null) {
                    entry["entry_name"] = "AVERAGE";
                }
                row.insertCell(0).innerHTML = entry["entry_name"];
                found = true;
                break;
            }
        }
        
        row.insertCell(1).innerHTML = team.total_points;
        row.insertCell(2).innerHTML = team.won;
        row.insertCell(3).innerHTML = team.lost;
        row.insertCell(4).innerHTML = team.drawn;
        row.insertCell(5).innerHTML = team.GF;
        row.insertCell(6).innerHTML = team.GA;
    }

    sessionStorage.setItem('currentGW', CURRENT_GW);
    return data;
});