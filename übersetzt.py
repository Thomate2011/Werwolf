from deep_translator import GoogleTranslator
import json

# Ausgangstexte auf Deutsch
texts = {
    "narrator_mode_title": "Spielmodus auswählen",
    "narrator_mode_description": "Möchtest du mit oder ohne automatischen Erzähler spielen?",
    "with_narrator": "Mit Erzähler spielen",
    "without_narrator": "Ohne Erzähler spielen",
    "narrator_mode_error_title": "Fehler: Keine Bösewichte",
    "narrator_mode_error_message": "Bitte mindestens einen Bösewicht auswählen (Werwolf, großer böser Werwolf, weißer Werwolf)",
    "to_role_selection": "Zur Rollenauswahl",
    "narrator_seating_info_title": "Wichtige Information",
    "narrator_seating_info_message": "Bitte setzt euch in der Reihenfolge hin, in der die Karten verteilt wurden.",
    "narrator_game_start_title": "Spiel starten",
    "narrator_game_start_listening": "Der Erzähler spricht gleich. Höre aufmerksam zu...",
    "narrator_game_start_button": "Zum Start",
    "narrator_game_start_waiting": "Audio wird abgespielt...",
    "narrator_game_start_ready": "Bereit? Drücke auf \"Zum Start\"",
    "narrator_mode_active": "Erzähler-Modus aktiv",
    "to_game": "Zum Spiel",
    "confirm": "Bestätigen",
    "stop": "Stopp",
    "narrator_day_deaths_title": "Die Nacht ist vorbei. Folgende Personen sind gestorben:",
    "narrator_day_no_deaths": "Diese Nacht ist niemand gestorben.",
    "narrator_day_maid_choice": "Ergebene Magd, möchtest du die Rolle eines Verstorbenen übernehmen?",
    "narrator_day_hunter_shoots": "Der Jäger ist gestorben. Mit deinem letzten Atemzug schießt du noch einen Schuss ab.",
    "narrator_day_discussion": "Diskussionsphase: Besprecht euch, wer der Werwolf sein könnte.",
    "narrator_day_voting": "Abstimmungsphase: Wählt eine Person aus, die ihr anklagen möchtet.",
    "narrator_day_voting_tie": "Es gibt einen Gleichstand. Der Sündenbock stirbt sofort.",
    "narrator_day_second_vote": "Zweite Abstimmung: Das Codewort des Richters wurde gesagt.",
    "narrator_day_dorfdepp": "Der Dorfdepp darf nicht sterben, aber verliert sein Abstimmungsrecht.",
    "narrator_day_angel_wins": "Der Engel ist in der ersten Abstimmung gestorben. Der Engel gewinnt!",
    "narrator_game_end_villagers_win": "Die Dorfbewohner haben gewonnen!",
    "narrator_game_end_werewolves_win": "Die Werwölfe haben gewonnen!",
    "narrator_game_end_white_wolf_wins": "Der weiße Werwolf hat alleine gewonnen!",
    "narrator_game_end_piper_wins": "Der Flötenspieler hat gewonnen!",
    "narrator_game_end_angel_wins": "Der Engel hat gewonnen!",
    "narrator_game_end_bitter_old_man_wins": "Der verbitterte Greis hat gewonnen!",
    "narrator_game_end_lovers_win": "Der Verliebten haben gewonnen!",
}

# Zielsprachen
languages = {
    "zh-CN": "chinese (simplified)",
}

output = ""

for lang_code, lang_name in languages.items():
    output += f'"{lang_code}": {{\n'
    print(f"Übersetze ins {lang_name}...")
    
    for key, value in texts.items():
        try:
            translated_value = GoogleTranslator(source='de', target=lang_name).translate(value)
            output += f'    {key}: "{translated_value}",\n'
        except Exception as e:
            print(f"⚠️ Fehler bei {key} ({lang_name}): {e}")
            output += f'    {key}: "{value}",\n'
    
    output += "},\n\n"

with open("translations1_output.txt", "w", encoding="utf-8") as f:
    f.write(output)

print("\n✅ Übersetzung abgeschlossen! Datei wurde gespeichert als: translations1_output.txt")
