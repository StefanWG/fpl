let DEFAULT_LEAGUE_ID = 10982;
let LEAGUE_DETAILS = null;
let PLAYER_STATS = {};
let SEASON_STATS = null;
let CURRENT_GW = 1;

let LOCAL_DB = {
    liveStats: {},
    lineups: {}
};

function getSelectedLeague() {
    return localStorage.getItem('fpl_selected_league') || DEFAULT_LEAGUE_ID;
}

function switchLeague(leagueId) {
    localStorage.setItem('fpl_selected_league', leagueId);
    window.location.reload();
}

async function getLeagueDetails() {
    if (LEAGUE_DETAILS != null) {
        return LEAGUE_DETAILS;
    }
    let leagueId = getSelectedLeague();
    try {
        const response = await fetch(`data/leagues/${leagueId}/league_details.json`);
        LEAGUE_DETAILS = await response.json();
    } catch (e) {
        // Fallback to root data folder if legacy structure is used
        const response = await fetch('data/league_details.json');
        LEAGUE_DETAILS = await response.json();
    }
    return LEAGUE_DETAILS;
}

async function getLineup(entry_id, gw) {
    if (entry_id == null) {
        return {"element":[]};
    }
    let leagueId = getSelectedLeague();
    let key = `${leagueId}_${entry_id}_gw_${gw}`;
    if (LOCAL_DB.lineups[key]) {
        return LOCAL_DB.lineups[key];
    }
    try {
        const response = await fetch(`data/leagues/${leagueId}/lineups/entry_${entry_id}_gw_${gw}.json`);
        const data = await response.json();
        LOCAL_DB.lineups[key] = data; // Keep full object so `subs` can be accessed
        return LOCAL_DB.lineups[key];
    } catch (e) {
        return {};
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

// Sync dropdown state on page load
document.addEventListener("DOMContentLoaded", () => {
    let select = document.getElementById("league-select");
    if (select) {
        select.value = getSelectedLeague();
    }
});