getLeagueDetails().then(data => {
    let matches = data["matches"];
    let standings = {};
    for (let match of matches) {
        if (!match["finished"]) continue
        console.log(match);
        CURRENT_GW = Math.max(match["event"], CURRENT_GW);
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
    let standings_ = []
    for (let team in standings) {
        standings_.push({ "id": team, ...standings[team] });
    }
    standings_.sort((a, b) => b["total_points"] - a["total_points"] || (b["GF"] - a["GF"]));
    
    let standings_table = document.getElementById("standings").getElementsByTagName('tbody')[0];
    for (let team of standings_) {
        let row = standings_table.insertRow();
        // Find team name
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
        row.insertCell(3).innerHTML = team.drawn;
        row.insertCell(4).innerHTML = team.lost;
        row.insertCell(5).innerHTML = team.GF;
        row.insertCell(6).innerHTML = team.GA;
    }
    CURRENT_GW += 1; // 1 more than last finished
    sessionStorage.setItem('currentGW', CURRENT_GW);

    return data
    
}).then(data =>{
    console.log(data["league_entries"]);

});


