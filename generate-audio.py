import os
import json
from elevenlabs import generate, save, set_api_key

# Setze deinen API-Key
set_api_key(os.getenv("ELEVEN_API_KEY"))

texts = {
    "narrator_intro": "Das gruselige Werwolfspiel von Thomas. Seid ihr bereit zum Starten?",
    "narrator_reine_seele": "Reine Seele, du darfst dich jetzt allen anderen zeigen.",
    "narrator_close_eyes": "Alle Bürger, schließt jetzt bitte eure Augen.",
    "narrator_waisenkind_open": "Waisenkind, du darfst deine Augen jetzt öffnen.",
    "narrator_waisenkind_intro": "Waisenkind, such dir ein Vorbild aus, dessen Arbeit du erlernen willst.",
    "narrator_waisenkind_show_role": "Ich zeige dir jetzt die Rolle deines Vorbilds.",
    "narrator_waisenkind_ability": "Falls dein Vorbild in der Nacht aufwacht, darfst du mit aufwachen und Entscheidungen mitentscheiden.",
    "narrator_waisenkind_close": "Waisenkind, du darfst jetzt deine Augen schließen.",
    "narrator_dieb_open": "Dieb, du darfst deine Augen jetzt öffnen.",
    "narrator_dieb_action": "Drücke auf eine der Rollen. Die Rolle, die du auswählst, wirst du für den Rest der Runde spielen.",
    "narrator_dieb_close": "Dieb, schließe jetzt deine Augen.",
    "narrator_gaukler_open": "Gaukler, du darfst deine Augen jetzt öffnen.",
    "narrator_gaukler_intro": "Das sind die drei für dich ausgewählten Rollen.",
    "narrator_gaukler_action": "Du kannst dich jetzt entscheiden, welche Rolle du für diese Nacht spielen möchtest. In der nächsten Nacht kannst du wieder eine andere Rolle auswählen.",
    "narrator_gaukler_selected": "Das ist jetzt deine Rolle für diese Nacht.",
    "narrator_gaukler_close": "Gaukler, du darfst deine Augen jetzt wieder schließen.",
    "narrator_verbitterte_greis_open": "Verbitterter Greis, du darfst deine Augen jetzt öffnen.",
    "narrator_verbitterte_greis_intro": "Teile unsere Gruppe in zwei kleinere, gleich große Gruppen auf.",
    "narrator_verbitterte_greis_warning": "Die Gruppen müssen gleich groß sein, maximal eine Person Unterschied.",
    "narrator_verbitterte_greis_close": "Verbitterter Greis, du darfst deine Augen wieder schließen.",
    "narrator_amor_open": "Amor, du darfst deine Augen jetzt öffnen.",
    "narrator_amor_intro": "Wähle zwei Personen aus, die du verkuppeln möchtest.",
    "narrator_amor_tap": "Amor, tippe die beiden Verliebten an.",
    "narrator_amor_close": "Amor, schließe jetzt deine Augen.",
    "narrator_amor_wake": "Verliebten, ihr dürft eure Augen öffnen und euch gegenseitig sehen.",
    "narrator_amor_explanation": "Ihr seid jetzt unsterblich ineinander verliebt. Wenn einer von euch stirbt, stirbt auch der andere.",
    "narrator_amor_sleep": "Schließt eure Augen bitte wieder.",
    "narrator_wolfshund_open": "Wolfshund, du darfst deine Augen jetzt öffnen.",
    "narrator_wolfshund_intro": "Du darfst dich entscheiden: willst du ein Dorfbewohner oder ein Werwolf sein?",
    "narrator_wolfshund_action": "Tippe auf das, was du sein willst.",
    "narrator_wolfshund_close": "Wolfshund, du darfst deine Augen wieder schließen.",
    "narrator_drei_brueder_open": "Drei Brüder, ihr dürft eure Augen jetzt öffnen.",
    "narrator_drei_brueder_intro": "Schaut euch an, damit ihr euch erkennt.",
    "narrator_drei_brueder_explanation": "Das sind eure anderen Brüder. Ihr wisst, dass ihr normale Dorfbewohner seid.",
    "narrator_drei_brueder_close": "Brüder, ihr dürft eure Augen jetzt wieder schließen.",
    "narrator_zwei_schwestern_open": "Zwei Schwestern, ihr dürft eure Augen jetzt öffnen.",
    "narrator_zwei_schwestern_intro": "Schaut euch um, damit ihr euer anderes Schwesternkind seht.",
    "narrator_zwei_schwestern_explanation": "Das ist euer anderes Schwesternkind. Ihr wisst einfach, dass es ein normales Dorfbewohnerkind ist.",
    "narrator_zwei_schwestern_close": "Ihr dürft eure Augen jetzt wieder schließen.",
    "narrator_wilde_kind_open": "Wildes Kind, du darfst deine Augen jetzt öffnen.",
    "narrator_wilde_kind_intro": "Wähle eine Person aus, die dein Vorbild sein soll.",
    "narrator_wilde_kind_explanation": "Das ist dein Vorbild. Wenn dieses Vorbild stirbt, wirst du zum Werwolf.",
    "narrator_wilde_kind_close": "Wildes Kind, du darfst deine Augen jetzt wieder schließen.",
    "narrator_richter_open": "Richter, du darfst deine Augen jetzt öffnen.",
    "narrator_richter_intro": "Tippe ein Codewort ein, welches, wenn du es an diesem Tag sagst, eine zweite Runde der Abstimmung erzeugt.",
    "narrator_richter_instruction": "Dein Codewort muss geheim bleiben.",
    "narrator_richter_close": "Richter, schließe jetzt bitte wieder deine Augen.",
    "narrator_seherin_open": "Seherin, du darfst deine Augen jetzt öffnen.",
    "narrator_seherin_intro": "Wähle eine Person aus, von der du die Rolle sehen möchtest.",
    "narrator_seherin_show": "Ich zeige dir jetzt die Rolle dieser Person.",
    "narrator_seherin_close": "Seherin, schließe jetzt bitte wieder deine Augen.",
    "narrator_heiler_open": "Heiler, du darfst deine Augen öffnen.",
    "narrator_heiler_intro": "Wähle eine Person aus, die du beschützen möchtest.",
    "narrator_heiler_protection": "Diese Person wird, egal durch was sie getötet werden würde, nicht sterben.",
    "narrator_heiler_rule": "Du darfst keine Person zweimal hintereinander beschützen.",
    "narrator_heiler_close": "Heiler, du darfst deine Augen wieder schließen.",
    "narrator_werwolf_open": "Werwölfe, ihr dürft jetzt eure Augen öffnen.",
    "narrator_werwolf_intro": "Sucht euch eine Person aus, die ihr fressen wollt.",
    "narrator_werwolf_close": "Werwölfe, schließt jetzt eure Augen.",
    "narrator_urwolf_open": "Urwolf, du darfst deine Augen jetzt öffnen.",
    "narrator_urwolf_intro": "Welche Person möchtest du in einen Werwolf verwandeln?",
    "narrator_urwolf_tap": "Urwolf, tippe die Person an, die du ausgewählt hast.",
    "narrator_urwolf_close": "Urwolf, schließe jetzt bitte wieder deine Augen.",
    "narrator_urwolf_info": "Die ausgewählte Person wird in der nächsten Nacht zum Werwolf und verliert ihre andere Rolle.",
    "narrator_hexe_open": "Hexe, du darfst deine Augen jetzt öffnen.",
    "narrator_hexe_intro": "Das ist das Opfer der Werwölfe.",
    "narrator_hexe_action_round1": "Möchtest du es mit einem Heiltrank retten oder sogar noch jemanden töten? Du darfst auch beide Tränke benutzen oder gar keinen. Die Tränke kannst du nur einmalig benutzen.",
    "narrator_hexe_action_round2plus": "Möchtest du es mit einem Heiltrank retten oder sogar noch jemanden töten? Du darfst auch beide Tränke benutzen oder gar keinen.",
    "narrator_hexe_close": "Hexe, schließe jetzt bitte wieder deine Augen.",
    "narrator_piper_open": "Flötenspieler, du darfst jetzt deine Augen öffnen.",
    "narrator_piper_intro": "Wähle zwei Personen aus, die du mit deiner Musik verzaubern möchtest.",
    "narrator_piper_tap": "Flötenspieler, tippe bitte die Verzauberten an.",
    "narrator_piper_close": "Flötenspieler, schließe jetzt deine Augen.",
    "narrator_piper_wake": "Verzauberten, ihr dürft jetzt aufwachen und euch mit Handzeichen besprechen, wer der Flötenspieler ist.",
    "narrator_piper_win": "Wenn der Flötenspieler alle Personen verzaubert hat, gewinnt er.",
    "narrator_piper_sleep": "Verzauberten, ihr dürft eure Augen jetzt wieder schließen.",
    "narrator_homeless_open": "Obdachloser, du darfst deine Augen jetzt öffnen.",
    "narrator_homeless_intro": "Suche dir eine Person aus, bei der du übernachten möchtest.",
    "narrator_homeless_rule": "Wenn die Person in der Nacht von den Werwölfen gefressen wird, stirbst du auch.",
    "narrator_homeless_restriction": "Du darfst nicht zwei Nächte hintereinander bei derselben Person schlafen.",
    "narrator_homeless_close": "Obdachloser, schließe jetzt bitte wieder deine Augen.",
    "narrator_fox_open": "Fuchs, du darfst deine Augen jetzt öffnen.",
    "narrator_fox_intro": "Wähle eine Person aus.",
    "narrator_fox_explanation": "Ich werde dir zeigen, ob sie oder einer ihrer beiden Nachbarn ein Werwolf ist.",
    "narrator_fox_result_yes": "In diesem Trio ist mindestens ein Werwolf.",
    "narrator_fox_result_no": "In diesem Trio ist kein Werwolf. Du verlierst deine Fähigkeit.",
    "narrator_fox_close": "Fuchs, du darfst deine Augen wieder schließen.",
    "narrator_open_eyes": "Die Nacht ist vorbei. Dorfbewohner, ihr dürft eure Augen wieder öffnen.",
    "narrator_big_bad_wolf_open": "Großer böser Werwolf, öffne jetzt bitte deine Augen.",
    "narrator_big_bad_wolf_intro": "Wähle noch ein zweites Opfer, das du in dieser Nacht töten möchtest.",
    "narrator_big_bad_wolf_close": "Großer böser Werwolf, schließe nun wieder bitte deine Augen.",
    "narrator_white_wolf_open": "Weißer Werwolf, du darfst jetzt deine Augen öffnen.",
    "narrator_white_wolf_intro": "Welchen deiner Werwolf-Kollegen möchtest du töten?",
    "narrator_white_wolf_close": "Weißer Werwolf, schließe jetzt wieder deine Augen.",
    "narrator_day_deaths_title": "Die Nacht ist vorbei. Folgende Personen sind gestorben:",
    "narrator_day_no_deaths": "Diese Nacht ist niemand gestorben.",
    "narrator_day_maid_choice": "Ergebene Magd, möchtest du die Rolle eines Verstorbenen übernehmen?",
    "narrator_day_hunter_shoots": "Der Jäger ist gestorben. Mit deinem letzten Atemzug schießt du noch einen Schuss ab.",
    "narrator_day_discussion": "Diskussionssphase: Besprecht euch, wer der Werwolf sein könnte.",
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
    "narrator_game_end_lovers_win": "Die Verliebten haben gewonnen!",
    "narrator_day_bear_growl": "(Grrrr... grrrr...)"
}

voice_id = "rDmv3mOhK6TnhYWckFaD"
os.makedirs("public/audio", exist_ok=True)

for key, text in texts.items():
    filename = f"public/audio/{key}.mp3"

    if os.path.exists(filename):
        print(f"  ✓ {key} (bereits vorhanden)")
        continue

    try:
        audio = generate(
            text=text,
            voice=voice_id,
            model="eleven_multilingual_v2"
        )

        save(audio, filename)
        print(f"  ✓ {key}")
    except Exception as e:
        print(f"  ✗ {key}: {e}")

print("\n🎉 Fertig! Alle Audio-Dateien in public/audio/")
