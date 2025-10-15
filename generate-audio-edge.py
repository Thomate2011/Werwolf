import asyncio
import edge_tts
import os


texts = {
    "ru": {
        
    },
    "is": {
        
    },
    "sv": {
        
    },
    "zh": {
        
    },
    "ja": {
        
    },
    "tr": {
        
    },
    "ar": {
        
    },
    "ko": {
        
    },
    "hi": {
        
    },
    "bn": {
        
    }
}


voices = {
    "de": "de-DE-ConradNeural",
    "en": "en-US-GuyNeural",
    "fr": "fr-FR-HenriNeural",
    "es": "es-ES-AlvaroNeural",
    "pt": "pt-PT-HugoNeural",
    "it": "it-IT-PietroNeural",
    "ru": "ru-RU-DmitryNeural",
    "is": "is-IS-GunnarNeural",
    "sv": "sv-SE-ArthurNeural",
    "zh": "zh-CN-YunfengNeural",
    "ja": "ja-JP-KeitaNeural",
    "tr": "tr-TR-AhmetNeural",
    "ar": "ar-SA-FaisalNeural",
    "ko": "ko-KR-InJoonNeural",
    "hi": "hi-IN-PrabhatNeural",
    "bn": "bn-IN-PrabhatNeural"
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
