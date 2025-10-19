import asyncio
import edge_tts
import os

texts = {
 "pt": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
    "narrator_intro": "The scary werewolf game from Thomas. Are you ready to start?",
    "narrator_reine_seele": "Pure soul, you can now show yourself to everyone else.",
    "narrator_close_eyes": "All citizens, please close your eyes now.",
    "narrator_waisenkind_open": "Orphan, you may open your eyes now.",
    "narrator_waisenkind_intro": "Orphan, choose a role model whose work you want to learn.",
    "narrator_waisenkind_show_role": "I'll now show you the role of your role model.",
    "narrator_waisenkind_ability": "If your role model wakes up in the night, you can wake up with them and have a say in decisions.",
    "narrator_waisenkind_close": "Orphan, you can close your eyes now.",
    "narrator_dieb_open": "Thief, you may open your eyes now.",
    "narrator_dieb_action": "Press one of the rollers. The role you choose is what you will play for the rest of the round.",
    "narrator_dieb_close": "Thief, close your eyes now.",
    "narrator_gaukler_open": "Juggler, you can open your eyes now.",
    "narrator_gaukler_intro": "These are the three roles selected for you.",
    "narrator_gaukler_action": "You can now decide what role you want to play for this night. The next night you can choose another role.",
    "narrator_gaukler_selected": "This is now your role for this night.",
    "narrator_gaukler_close": "Juggler, you can now close your eyes again.",
    "narrator_verbitterte_greis_open": "Embittered old man, you can open your eyes now.",
    "narrator_verbitterte_greis_intro": "Divide our group into two smaller, equal groups.",
    "narrator_verbitterte_greis_warning": "The groups must be the same size, with a maximum difference of one person.",
    "narrator_verbitterte_greis_close": "Embittered old man, you can close your eyes again.",
    "narrator_amor_open": "Cupid, you can open your eyes now.",
    "narrator_amor_intro": "Choose two people you want to pair up.",
    "narrator_amor_tap": "Cupid, tap the two lovers.",
    "narrator_amor_close": "Cupid, close your eyes now.",
    "narrator_amor_wake": "Lovers, you can open your eyes and see each other.",
    "narrator_amor_explanation": "You are now madly in love with each other. If one of you dies, the other dies too.",
    "narrator_amor_sleep": "Please close your eyes again.",
    "narrator_wolfshund_open": "Wolfhound, you can open your eyes now.",
    "narrator_wolfshund_intro": "You can decide: do you want to be a villager or a werewolf?",
    "narrator_wolfshund_action": "Tap into what you want to be.",
    "narrator_wolfshund_close": "Wolfhound, you can close your eyes again.",
    "narrator_drei_brueder_open": "Three brothers, you can open your eyes now.",
    "narrator_drei_brueder_intro": "Look at each other so that you can recognize each other.",
    "narrator_drei_brueder_explanation": "These are your other brothers. You know that you are normal villagers.",
    "narrator_drei_brueder_close": "Brothers, you can now close your eyes again.",
    "narrator_zwei_schwestern_open": "Two sisters, you can open your eyes now.",
    "narrator_zwei_schwestern_intro": "Look around so you can see your other baby sister.",
    "narrator_zwei_schwestern_explanation": "This is your other baby sister. You just know it's a normal villager kid.",
    "narrator_zwei_schwestern_close": "You can now close your eyes again.",
    "narrator_wilde_kind_open": "Wild child, you can open your eyes now.",
    "narrator_wilde_kind_intro": "Choose a person to be your role model.",
    "narrator_wilde_kind_explanation": "This is your role model. If this role model dies, you become a werewolf.",
    "narrator_wilde_kind_close": "Wild child, you can close your eyes again now.",
    "narrator_richter_open": "Judge, you may open your eyes now.",
    "narrator_richter_intro": "Type in a code word that, when said that day, will generate a second round of voting.",
    "narrator_richter_instruction": "Your code word must remain secret.",
    "narrator_richter_close": "Judge, please close your eyes again.",
    "narrator_seherin_open": "Seer, you may open your eyes now.",
    "narrator_seherin_intro": "Choose one person you would like to see the role.",
    "narrator_seherin_show": "I'll now show you this person's role.",
    "narrator_seherin_close": "Seer, please close your eyes again.",
    "narrator_heiler_open": "Healer, you may open your eyes.",
    "narrator_heiler_intro": "Choose one person you want to protect.",
    "narrator_heiler_protection": "This person, no matter what would kill them, will not die.",
    "narrator_heiler_rule": "You cannot protect a person twice in a row.",
    "narrator_heiler_close": "Healer, you may close your eyes again.",
    "narrator_werwolf_open": "Werewolves, you can open your eyes now.",
    "narrator_werwolf_intro": "Pick a person you want to eat.",
    "narrator_werwolf_close": "Werewolves, close your eyes now.",
    "narrator_urwolf_open": "Primal Wolf, you may open your eyes now.",
    "narrator_urwolf_intro": "Which person do you want to turn into a werewolf?",
    "narrator_urwolf_tap": "Primal Wolf, tap the person you selected.",
    "narrator_urwolf_close": "Urwolf, please close your eyes again.",
    "narrator_urwolf_info": "The chosen person becomes a werewolf the next night and loses their other role.",
    "narrator_hexe_open": "Witch, you may open your eyes now.",
    "narrator_hexe_intro": "This is the sacrifice of the werewolves.",
    "narrator_hexe_action_round1": "Do you want to save it with a healing potion or even kill someone else? You may also use both potions or none at all. You can only use the potions once.",
    "narrator_hexe_action_round2plus": "Do you want to save it with a healing potion or even kill someone else? You may also use both potions or none at all.",
    "narrator_hexe_close": "Witch, please close your eyes again.",
    "narrator_piper_open": "Flute player, you may now open your eyes.",
    "narrator_piper_intro": "Choose two people you want to enchant with your music.",
    "narrator_piper_tap": "Flute players, please tap the enchanted ones.",
    "narrator_piper_close": "Flute player, close your eyes now.",
    "narrator_piper_wake": "Enchanted ones, you may now wake up and discuss with a show of hands who the flute player is.",
    "narrator_piper_win": "If the flute player has enchanted everyone, he wins.",
    "narrator_piper_sleep": "Enchanted ones, you can now close your eyes again.",
    "narrator_homeless_open": "Homeless man, you can open your eyes now.",
    "narrator_homeless_intro": "Choose someone you would like to stay with.",
    "narrator_homeless_rule": "If the person is eaten by the werewolves in the night, you will die too.",
    "narrator_homeless_restriction": "You can't sleep with the same person two nights in a row.",
    "narrator_homeless_close": "Homeless man, please close your eyes again.",
    "narrator_fox_open": "Fox, you can open your eyes now.",
    "narrator_fox_intro": "Choose one person.",
    "narrator_fox_explanation": "I'll show you if she or one of her two neighbors is a werewolf.",
    "narrator_fox_result_yes": "There is at least one werewolf in this trio.",
    "narrator_fox_result_no": "There is no werewolf in this trio. You lose your ability.",
    "narrator_fox_close": "Fox, you can close your eyes again.",
    "narrator_open_eyes": "The night is over. Villagers, you can open your eyes again.",
    "narrator_big_bad_wolf_open": "Big bad werewolf, now please open your eyes.",
    "narrator_big_bad_wolf_intro": "Choose a second victim to kill that night.",
    "narrator_big_bad_wolf_close": "Big bad werewolf, please close your eyes again.",
    "narrator_white_wolf_open": "White werewolf, you may now open your eyes.",
    "narrator_white_wolf_intro": "Which of your werewolf colleagues do you want to kill?",
    "narrator_white_wolf_close": "White werewolf, now close your eyes again.",
    "narrator_day_deaths_title": "The night is over. The following people died:",
    "narrator_day_no_deaths": "Nobody died that night.",
    "narrator_day_maid_choice": "Devoted maid, would you like to take on the role of a deceased person?",
    "narrator_day_hunter_shoots": "The hunter died. With your last breath you fire one more shot.",
    "narrator_day_discussion": "Discussion phase: Discuss who the werewolf could be.",
    "narrator_day_voting": "Voting phase: Choose a person you want to accuse.",
    "narrator_day_voting_tie": "There is a tie. The scapegoat dies immediately.",
    "narrator_day_second_vote": "Second vote: The judge's code word was said.",
    "narrator_day_dorfdepp": "The village idiot is not allowed to die, but he loses his right to vote.",
    "narrator_day_angel_wins": "The angel died in the first vote. The angel wins!",
    "narrator_game_end_villagers_win": "The villagers won!",
    "narrator_game_end_werewolves_win": "The werewolves have won!",
    "narrator_game_end_white_wolf_wins": "The white werewolf won alone!",
    "narrator_game_end_piper_wins": "The flute player won!",
    "narrator_game_end_angel_wins": "The angel won!",
    "narrator_game_end_bitter_old_man_wins": "The bitter old man won!",
    "narrator_game_end_lovers_win": "The lovers have won!",
}
}


voices = {
    "de": "de-DE-ConradNeural",
    "en": "en-US-GuyNeural",
    "fr": "fr-FR-HenriNeural",
    "es": "es-ES-AlvaroNeural",
    "pt": "pt-PT-AntonioNeural",
    "it": "it-IT-AlessioMultilingualNeural",
    "ru": "ru-RU-DmitryNeural",
    "is": "is-IS-GunnarNeural",
    "sv": "sv-SE-MattiasNeural",
    "zh-CN": "zh-CN-YunfengNeural",
    "ja": "ja-JP-KeitaNeural",
    "tr": "tr-TR-AhmetNeural",
    "ar": "ar-SA-HamdanNeural",
    "ko": "ko-KR-InJoonNeural",
    "hi": "hi-IN-AaravNeural",
    "bn": "bn-IN-BashkarNeural",
    "pl": "pl-PL-MarekNeural",
    "da": "da-DK-JeppeNeural",
    "cs": "cs-CZ-AntoninNeural",
    "fi": "fi-FI-HarriNeural",
    "nb": "no-NO-FinnNeural",
    "ro": "ro-RO-EmilNeural",
    "he": "he-IL-AvriNeural",
    "hu": "hu-HU-TamasNeural",
    "nl": "nl-NL-MaartenNeural"
}


async def generate_audio(text, voice, filename):
    communicate = edge_tts.Communicate(text, voice, rate="-15%")
    await communicate.save(filename)

async def main():
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
                await generate_audio(text, voices[lang], filename)
                print(f"  ✓ {key}")
            except Exception as e:
                print(f"  ✗ {key}: {e}")
    
    print("\n🎉 Fertig!")

asyncio.run(main()) 
