import os
import json
from elevenlabs import ElevenLabs

client = ElevenLabs(api_key=os.getenv("ELEVEN_API_KEY"))

texts = {
    "en": {
    "narrator_close_eyes": "All villagers, please close your eyes now.",
    "narrator_open_eyes": "The night is over. Villagers, you may open your eyes again.",
    "narrator_reine_seele": "Pure soul, you may now reveal yourself to everyone.",
    "narrator_waisenkind_open": "Orphan, you may now open your eyes.",
    "narrator_waisenkind_intro": "Orphan, choose a role model whose work you wish to learn.",
    "narrator_waisenkind_show_role": "I will now show you the role of your role model.",
    "narrator_waisenkind_ability": "If your role model wakes up during the night, you may also wake up and take part in the decision.",
    "narrator_waisenkind_close": "Orphan, you may now close your eyes.",
    "narrator_dieb_open": "Thief, you may now open your eyes.",
    "narrator_dieb_intro": "I am now holding the two remaining roles in my hand.",
    "narrator_dieb_action": "Tap on one of the roles. The role you choose will be yours for the rest of the round.",
    "narrator_dieb_close": "Thief, now close your eyes.",
    "narrator_gaukler_open": "Jester, you may now open your eyes.",
    "narrator_gaukler_intro": "I am now holding the three roles chosen for you in my hand.",
    "narrator_gaukler_action": "You can now decide which role you want to play for this night. The next night you can choose another role again.",
    "narrator_gaukler_selected": "This is your role for this night.",
    "narrator_gaukler_close": "Jester, you may now close your eyes again.",
    "narrator_verbitterte_greis_open": "Bitter Old Man, you may now open your eyes.",
    "narrator_verbitterte_greis_intro": "Divide our group into two smaller, equally sized groups.",
    "narrator_verbitterte_greis_warning": "The groups must be of equal size, at most one person difference.",
    "narrator_verbitterte_greis_win": "If the group you are not in dies and you still live, you win.",
    "narrator_verbitterte_greis_close": "Bitter Old Man, you may now close your eyes again.",
    "narrator_amor_open": "Cupid, you may now open your eyes.",
    "narrator_amor_intro": "Choose two people you wish to make lovers.",
    "narrator_amor_tap": "Cupid, tap the two lovers.",
    "narrator_amor_close": "Cupid, now close your eyes.",
    "narrator_amor_wake": "Lovers, you may open your eyes and look at each other.",
    "narrator_amor_explanation": "You are now deeply in love with each other. If one of you dies, the other will also die.",
    "narrator_amor_sleep": "Please close your eyes again.",
    "narrator_wolfshund_open": "Wolfhound, you may now open your eyes.",
    "narrator_wolfshund_intro": "You may decide: do you want to be a villager or a werewolf?",
    "narrator_wolfshund_action": "Tap what you wish to be.",
    "narrator_wolfshund_close": "Wolfhound, you may now close your eyes again.",
    "narrator_drei_brueder_open": "Three Brothers, you may now open your eyes.",
    "narrator_drei_brueder_intro": "Look at each other so you recognize one another.",
    "narrator_drei_brueder_explanation": "These are your brothers. You know that you are ordinary villagers.",
    "narrator_drei_brueder_close": "Brothers, you may now close your eyes again.",
    "narrator_zwei_schwestern_open": "Two Sisters, you may now open your eyes.",
    "narrator_zwei_schwestern_intro": "Look around so you can see your sister.",
    "narrator_zwei_schwestern_explanation": "This is your sister. You know that she is an ordinary villager child.",
    "narrator_zwei_schwestern_close": "You may now close your eyes again.",
    "narrator_wilde_kind_open": "Wild Child, you may now open your eyes.",
    "narrator_wilde_kind_intro": "Choose a person who will be your role model.",
    "narrator_wilde_kind_explanation": "This is your role model. If your role model dies, you will become a werewolf.",
    "narrator_wilde_kind_close": "Wild Child, you may now close your eyes again.",
    "narrator_richter_open": "Judge, you may now open your eyes.",
    "narrator_richter_intro": "Enter a code word that, when spoken during the day, will trigger a second round of voting.",
    "narrator_richter_instruction": "Your code word must remain secret.",
    "narrator_richter_close": "Judge, please close your eyes again.",
    "narrator_seherin_open": "Seer, you may now open your eyes.",
    "narrator_seherin_intro": "Choose a person whose role you want to see.",
    "narrator_seherin_show": "I will now show you that person’s role.",
    "narrator_seherin_close": "Seer, please close your eyes again.",
    "narrator_heiler_open": "Healer, you may open your eyes.",
    "narrator_heiler_intro": "Choose a person you want to protect.",
    "narrator_heiler_protection": "This person will not die, no matter what would normally kill them.",
    "narrator_heiler_rule": "You cannot protect the same person twice in a row.",
    "narrator_heiler_close": "Healer, you may now close your eyes again.",
    "narrator_werwolf_open": "Werewolves, you may now open your eyes.",
    "narrator_werwolf_intro": "Choose a person you want to devour.",
    "narrator_werwolf_close": "Werewolves, close your eyes now.",
    "narrator_urwolf_open": "Alpha Wolf, you may now open your eyes.",
    "narrator_urwolf_intro": "Which person do you want to turn into a werewolf?",
    "narrator_urwolf_tap": "Alpha Wolf, tap the person you have chosen.",
    "narrator_urwolf_close": "Alpha Wolf, please close your eyes again.",
    "narrator_urwolf_info": "The chosen person will become a werewolf the next night and lose their previous role.",
    "narrator_hexe_open": "Witch, you may now open your eyes.",
    "narrator_hexe_intro": "This is the victim of the werewolves.",
    "narrator_hexe_action": "Do you want to save them with your healing potion? If yes, give a thumbs up. Do you want to kill someone else? If yes, give a thumbs down. Or if you want to do nothing, give a thumbs to the side. You may also use both potions in the same night.",
    "narrator_hexe_close": "Witch, please close your eyes again.",
    "narrator_big_bad_wolf_open": "Big Bad Wolf, please open your eyes now.",
    "narrator_big_bad_wolf_intro": "Choose another victim you want to kill this night.",
    "narrator_big_bad_wolf_close": "Big Bad Wolf, please close your eyes again.",
    "narrator_white_wolf_open": "White Wolf, you may now open your eyes.",
    "narrator_white_wolf_intro": "Which of your fellow werewolves do you want to kill?",
    "narrator_white_wolf_close": "White Wolf, please close your eyes again.",
    "narrator_piper_open": "Piper, you may now open your eyes.",
    "narrator_piper_intro": "Choose two people you wish to enchant with your music.",
    "narrator_piper_tap": "Piper, please tap the enchanted ones.",
    "narrator_piper_close": "Piper, close your eyes now.",
    "narrator_piper_wake": "Enchanted ones, you may wake up and use hand signs to discuss who the Piper is.",
    "narrator_piper_win": "When the Piper has enchanted all people, he wins.",
    "narrator_piper_sleep": "Enchanted ones, you may now close your eyes again.",
    "narrator_homeless_open": "Homeless, you may now open your eyes.",
    "narrator_homeless_intro": "Choose a person at whose place you want to sleep.",
    "narrator_homeless_rule": "If that person is eaten by the werewolves during the night, you die as well.",
    "narrator_homeless_restriction": "You cannot sleep at the same place two nights in a row.",
    "narrator_homeless_close": "Homeless, please close your eyes again.",
    "narrator_fox_open": "Fox, you may now open your eyes.",
    "narrator_fox_intro": "Choose a person.",
    "narrator_fox_explanation": "I will show you whether this person or one of their neighbors is a werewolf.",
    "narrator_fox_result_yes": "There is at least one werewolf in this trio.",
    "narrator_fox_result_no": "There is no werewolf in this trio. You lose your ability.",
    "narrator_fox_close": "Fox, you may now close your eyes again.",
    "death_overview_title": "Death Overview",
    "no_deaths_tonight": "No one has died tonight.",
    "deaths_occurred": "Players have died on these nights.",
    "hunter_shoots": "was a hunter.",
    "hunter_choice": "Choose a person you want to take down with you.",
    "maid_choice_title": "Loyal Maid",
    "maid_choice_desc": "Do you want to take over the role of a deceased player?",
    "maid_choice_yes": "Yes, take the role",
    "maid_choice_no": "No, continue playing",
    "maid_select_dead": "Choose a deceased player whose role you want to take over.",
    "maid_device_handover": "Hand the device to the loyal maid.",
    "maid_reveal_role": "Reveal the new role.",
    "maid_back_to_game": "Back to the game.",
    "elder_died_title": "The Elder has died.",
    "elder_died_desc": "Do you want to play the variant where all other special actions disappear?",
    "elder_all_abilities_lost": "All other special actions disappear.",
    "elder_normal_continue": "Continue playing normally.",
    "discussion_phase": "Discussion Phase",
    "discuss_who_to_vote": "Discuss who you think might be the werewolf.",
    "start_voting": "Proceed to voting.",
    "voting_title": "Voting",
    "voting_desc": "Together, choose one person you wish to accuse.",
    "scapegoat_tie": "Tie with the scapegoat.",
    "second_vote_triggered": "Second voting triggered, code word was spoken.",
    "dorfdepp_killed_title": "Village Idiot killed.",
    "dorfdepp_killed_desc": "The Village Idiot may stay alive but can no longer vote.",
    "game_over_title": "Game over.",
    "villagers_win": "The villagers have won.",
    "werewolves_win": "The werewolves have won.",
    "white_wolf_wins": "The White Wolf has won.",
    "piper_wins": "The Piper has won.",
    "angel_wins": "The Angel has won.",
    "bitter_old_man_wins": "The Bitter Old Man has won.",
    "lovers_win": "The lovers have won.",
    "restart": "Restart",
    "restart_info": "Roles and names are saved.",
    "to_homepage": "To homepage.",
    "homepage_info": "Complete reset.",
    "narrator_mode_title": "Select game mode",
    "narrator_mode_description": "Would you like to play with or without an automatic narrator?",
    "with_narrator": "Play with narrator",
    "without_narrator": "Play without narrator",
    "narrator_mode_error_title": "Error: No villains",
    "narrator_mode_error_message": "Please select at least one villain (werewolf, big bad werewolf, white werewolf)",
    "to_role_selection": "Go to role selection",
    "narrator_seating_info_title": "Important information",
    "narrator_seating_info_message": "Please sit in the same order in which the cards were dealt.",
    "narrator_game_start_title": "Start game",
    "narrator_game_start_listening": "The narrator will start speaking soon. Listen carefully...",
    "narrator_game_start_button": "To start",
    "narrator_game_start_waiting": "Audio is playing...",
    "narrator_game_start_ready": "Ready? Press 'To start'",
    "narrator_intro": "narrator_intro",
    "narrator_mode_active": "Narrator mode active",
    "confirm": "Confirm",
    "stop": "Stop",
    "next": "Next",
    "game_end_villagers_win": "The villagers have won!",
    "game_end_werewolves_win": "The werewolves have won!",
    "game_end_white_wolf_wins": "The white werewolf has won alone!",
    "game_end_piper_wins": "The piper has won!",
    "game_end_angel_wins": "The angel has won!",
    "game_end_bitter_old_man_wins": "The bitter old man has won!",
    "game_end_lovers_win": "The lovers have won!"
}
}
   
voices = {
    "en": "24EI9FmmGvJruwUi7TJM"
}

os.makedirs("public/audio", exist_ok=True)

for lang, texts_dict in texts.items():
    print(f"Generiere {lang}...")
    os.makedirs(f"public/audio/{lang}", exist_ok=True)
    
    for key, text in texts_dict.items():
        filename = f"public/audio/{lang}/{key}.mp3"
        
        if os.path.exists(filename):
            print(f"  ✓ {key} (bereits vorhanden)")
            continue
    
        try:
            audio = client.text_to_speech.convert(
                voice_id=voices.get(lang, voices["en"]),
                model_id="eleven_multilingual_v2",
                text=text
            )

            # Audio speichern
            with open(filename, "wb") as f:
                for chunk in audio:
                    f.write(chunk)

            print(f"  ✓ {key}")
        except Exception as e:
            print(f"  ✗ {key}: {e}")

print("\n🎉 Fertig! Alle Audio-Dateien in public/audio/")