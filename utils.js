let LEAGUE_ID = 10982;
let LEAGUE_DETAILS = null;
let PLAYER_STATS = {};
let SEASON_STATS = null;
let CURRENT_GW = 2;

// Local database store
let LOCAL_DB = {
    liveStats: {},
    lineups: {}
};

async function getLeagueDetails() {
    if (LEAGUE_DETAILS != null) {
        return LEAGUE_DETAILS;
    }
    const response = await fetch('data/league_details.json');
    LEAGUE_DETAILS = await response.json();
    return LEAGUE_DETAILS;
}

async function getLineup(entry_id, gw) {
    if (entry_id == null) {
        return {"element":[]};
    }
    let key = `${entry_id}_${gw}`;
    if (LOCAL_DB.lineups[key]) {
        return LOCAL_DB.lineups[key];
    }
    try {
        const response = await fetch(`data/lineups/entry_${entry_id}_gw_${gw}.json`);
        const data = await response.json();
        LOCAL_DB.lineups[key] = data.picks || [];
        return LOCAL_DB.lineups[key];
    } catch (e) {
        return [];
    }
}

async function getLiveStats(gameweek) {
    if (gameweek in PLAYER_STATS) {
        return PLAYER_STATS[gameweek];
    }
    try {
        const response = await fetch(`data/live_gw_${gameweek}.json`);
        const data = await response.json();
        PLAYER_STATS[gameweek] = data["elements"];
        return PLAYER_STATS[gameweek];
    } catch (e) {
        PLAYER_STATS[gameweek] = {};
        return PLAYER_STATS[gameweek];
    }
}

async function getSeasonStats() {
    if (SEASON_STATS != null) {
        return SEASON_STATS;
    } 
    const response = await fetch('data/bootstrap-static.json');
    SEASON_STATS = await response.json();
    return SEASON_STATS;
}

async function getGWLiveScore(lineup, gw) {
    let stats = await getLiveStats(gw);
    let total_points = 0;
    for (let i = 0; i < 11; i++) {
        let player = lineup[i];
        if (player && stats[player["element"]]) {
            total_points += stats[player["element"]]["stats"]["total_points"];
        }
    }
    return total_points;
}