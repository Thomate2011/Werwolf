from deep_translator import GoogleTranslator
import json

# Ausgangstexte auf Deutsch
texts = {
    "narrator_select_waisenkind": "Wähle ein Vorbild aus (nicht dich selbst)",
    "narrator_select_dieb_cards": "Wähle eine der 2 Karten",
    "narrator_select_gaukler_cards": "Wähle eine der 3 Rollen",
    "narrator_select_greis_half": "Wähle genau die Hälfte aller Spieler",
    "narrator_select_amor_first": "Wähle die erste verliebte Person",
    "narrator_select_amor_second": "Wähle die zweite verliebte Person",
    "narrator_select_wolfshund_choice": "Wähle: Dorfbewohner oder Werwolf?",
    "narrator_select_richter_codeword": "Gib dein geheimes Codewort ein",
    "narrator_select_seherin": "Wähle eine Person, deren Rolle du sehen möchtest (nicht dich selbst)",
    "narrator_select_heiler": "Wähle eine Person zum Beschützen",
    "narrator_select_werwolf": "Wähle eine Person zu töten (nicht andere Werwölfe)",
    "narrator_select_urwolf": "Wähle eine Person zu infizieren",
    "narrator_select_hexe_action": "Heiltrank / Gifttrank / Nichts tun",
    "narrator_select_piper": "Wähle 2 Personen zum Verzaubern",
    "narrator_select_homeless": "Wähle eine Person, bei der du übernachtst",
    "narrator_select_fuchs": "Wähle eine Person zum Prüfen",
    "narrator_select_big_bad_wolf": "Wähle ein 2. Opfer (nicht andere Werwölfe)",
    "narrator_select_white_wolf": "Wähle einen Werwolf zu töten",
    "narrator_hexe_heal_button": "Heiltrank",
    "narrator_hexe_poison_button": "Gifttrank",
    "narrator_hexe_nothing_button": "Nichts tun",
    "narrator_hexe_heal_used": "Heiltrank bereits benutzt",
    "narrator_hexe_poison_used": "Gifttrank bereits benutzt",
    "narrator_fuchs_werewolf_found": "Mindestens einer von den drei ist ein Werwolf!",
    "narrator_fuchs_no_werewolf": "Keiner von den drei ist ein Werwolf. Du hast deine Fähigkeit verloren.",
    "narrator_piper_already_enchanted": "Diese Personen sind bereits verzaubert und können nicht erneut gewählt werden",
    "narrator_pause_auto": "⏸️ Pause... (überspring mit Weiter)",
    "narrator_day_maid_button": "👩🏼 Ergebene Magd",
    "narrator_day_maid_select_dead": "Wähle einen Verstorbenen zur Rollenübernahme",
    "narrator_day_maid_role_reveal": "Gerät an die Ergebene Magd übergeben - Rolle aufdecken",
    "narrator_day_voting_select": "Wähle eine Person zur Abstimmung",
    "narrator_day_scapegoat": "Gleichstand - Sündenbock stirbt!",
    "narrator_day_codewort_spoken": "Das Codewort wurde gesagt - Zweite Abstimmung!",
    "narrator_day_dorfdepp_cannot_die": "Der Dorfdepp darf nicht sterben, verliert aber sein Stimmrecht",
    "narrator_day_angel_wins_vote": "Der Engel stirbt! Der Engel gewinnt!",
    "narrator_day_hunter_shoots_before_death": "Der Jäger schießt vor dem Tod",
    "narrator_day_lover_dies_too": "Ein Verliebter stirbt - der andere auch!",
    "narrator_win_check": "Gewinn-Bedingung wird geprüft...",
    "narrator_win_villagers_end": "Die Dorfbewohner haben gewonnen!",
    "narrator_win_werewolves_end": "Die Werwölfe haben gewonnen!",
    "narrator_win_white_wolf_end": "Der weiße Werwolf hat allein gewonnen!",
    "narrator_win_piper_end": "Der Flötenspieler hat gewonnen!",
    "narrator_win_angel_end": "Der Engel hat gewonnen!",
    "narrator_win_bitter_old_man_end": "Der verbitterte Greis hat gewonnen! (Gegnergruppe eliminiert)",
    "narrator_win_lovers_end": "Die Verliebten haben gewonnen!",
    "narrator_selection_invalid": "Ungültige Auswahl",
    "narrator_cannot_select_yourself": "Du kannst dich nicht selbst auswählen",
    "narrator_cannot_heal_same_twice": "Du kannst nicht dieselbe Person zweimal hintereinander heilen",
    "narrator_cannot_select_werewolves": "Du kannst keine Werwölfe auswählen",
    "narrator_select_exactly_half": "Wähle genau die Hälfte der Spieler"
}

# Zielsprachen
languages = {
  "de": "german",
  "en": "english",
  "fr": "french",
  "es": "spanish",
  "pt": "portuguese",
  "it": "italian",
  "ru": "russian",
  "is": "icelandic",
  "sv": "swedish",
  "zh": "chinese (simplified)",
  "ja": "japanese",
  "tr": "turkish",
  "ar": "arabic",
  "ko": "korean",
  "hi": "hindi",
  "bn": "bengali",
  "pl": "polish",
  "da": "danish",
  "cs": "czech",
  "fi": "finnish",
  "no": "norwegian",
  "hu": "hungarian",
  "nl": "dutch",
  "ro": "romanian",
  "he": "hebrew"
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
