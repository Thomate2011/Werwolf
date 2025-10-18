import asyncio
import edge_tts
import os

texts = {
 "pt": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"it": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"sv": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"ar": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"hi": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"bn": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"pl": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"nl": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"he": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
},
"nb": {
    "narrator_day_bear_growl": "(Grrrr... grrrr...)",
}
}


voices = {
    "pt": "pt-BR-AntonioNeural",
    "it": "it-IT-AlessioMultilingualNeural",
    "sv": "sv-SE-MattiasNeural",
    "ar": "ar-AE-HamdanNeural",
    "hi": "hi-IN-AaravNeural",
    "bn": "bn-IN-BashkarNeural",
    "pl": "pl-PL-MarekNeural",
    "nl": "nl-NL-MaartenNeural",
    "he": "he-IL-AvriNeural",
    "nb": "nb-NO-FinnNeural",
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
