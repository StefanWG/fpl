from shiny import App, ui, render, reactive
import pandas as pd
import numpy as np
import utils

app_ui = ui.page_fluid(
    ui.h1("Sports League Dashboard"),
    
    ui.navset_tab(
        ui.nav_panel("Standings",
            ui.h2("League Standings"),
            ui.output_table("standings_table")
        ),
        ui.nav_panel("Matches",
            ui.row(
                ui.column(12,
                    ui.h2("Matches"),
                    ui.row(
                        ui.column(4,
                            ui.input_select(
                                "gameweek",
                                "Select Gameweek:",
                                choices={str(i): f"Gameweek {i}" for i in range(2, 39)},
                                selected="1"
                            )
                        ),
                        ui.column(8,
                            ui.output_text("gameweek_info")
                        )
                    ),
                    ui.hr(),
                    ui.output_table("matches_table")
                )
            )
        ),
        ui.nav_panel("Teams",
            ui.h2("Teams"),
            ui.p("Teams content coming soon...")
        )
    )
)

def server(input, output, session):

    def get_standings_data():
        standings_df = standings.rename(columns={
            "total_points":"Points",
            "won":"W",
            "drawn":"D",
            "lost":"L",    
        })
        standings_df["+/-"] = standings_df["GF"] - standings_df["GA"]
        return standings_df.sort_values(by=["Points", "GF"], ascending=False).reset_index(drop=True)
    
    @render.table
    def standings_table():
        return get_standings_data()
    
    @reactive.calc
    def get_matches_data():
        gameweek = int(input.gameweek())
        m = []
        for match in matches[gameweek]:
            if match["finished"]:
                score = f"{match['league_entry_1_points']}-{match['league_entry_2_points']}"
            else:
                score = " vs "
            m.append({
                'Home Team': teams[match["league_entry_1"]],
                'Score': score,
                'Away Team': teams[match["league_entry_2"]]
            })
        
        return pd.DataFrame(m)
    
    @render.table
    def matches_table():
        return get_matches_data()
    
    @render.text
    def gameweek_info():
        gw = int(input.gameweek())
        if matches[gw][0]["finished"]:
            return f"Gameweek {gw} - Completed"
        else:
            return f"Gameweek {gw} - Scheduled"
    


league_details = utils.get_league_details()
matches = utils.get_league_matches(league_details)
teams = utils.get_teams(league_details)
standings = utils.get_league_standings(matches)
standings = utils.add_team_names(standings, teams)

app = App(app_ui, server)