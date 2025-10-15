import os
import json
from elevenlabs import generate, save, set_api_key

set_api_key(os.getenv("ELEVEN_API_KEY"))

texts = {
    "de": {
        
    }
}

voices = {
    "de": "pNInz6obpgDQGcFmaJgB",  
    "en": "21m00Tcm4TlvDq8ikWAM" 
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
            audio = generate(
                text=text,
                voice=voices.get(lang, voices["en"]),
                model="eleven_multilingual_v2"
            )
            
       
            save(audio, filename)
            print(f"  ✓ {key}")
        
        except Exception as e:
            print(f"  ✗ {key}: {e}")

print("\n🎉 Fertig! Alle Audio-Dateien in public/audio/")












kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
kjesfidscbeirvbadbvieabviuaebfiebarivbfeifbawiebfieabfiabeifaeibfiueaifubeaifbweifiuwaebfiwaebfiua
