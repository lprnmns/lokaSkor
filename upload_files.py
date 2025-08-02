import google.generativeai as genai
import os

# --- AYARLAR BÖLÜMÜ ---
# API Anahtarınızı GOOGLE_API_KEY ortam değişkeni olarak ayarlamanız en güvenlisidir.
# Terminalde: export GOOGLE_API_KEY="ANAHTARINIZ"
# Bu script o değişkeni otomatik olarak bulacaktır.

PROJE_YOLU = "/home/manas/lokasyon_projesi"
DOSYA_ADI = "örnek_dosya.js" # Üzerinde çalışmak istediğiniz dosyanın adı

def start_interactive_session():
    """
    Belirtilen dosyayı bağlam olarak kullanarak Gemini ile interaktif bir sohbet başlatır.
    """
    try:
        # API anahtarını ortam değişkeninden al
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("HATA: Lütfen API anahtarınızı GOOGLE_API_KEY ortam değişkenine ayarlayın.")
            print("Komut: export GOOGLE_API_KEY=\"YOUR_API_KEY\"")
            return

        genai.configure(api_key=api_key)

        # Üzerinde çalışılacak dosyayı oku
        dosya_yolu = os.path.join(PROJE_YOLU, DOSYA_ADI)
        with open(dosya_yolu, "r", encoding="utf-8") as f:
            dosya_icerigi = f.read()

        # Modeli ve sohbeti başlat
        model = genai.GenerativeModel('gemini-2.5-pro-latest')
        # chat.send_message metodu sohbet geçmişini otomatik yönetir.
        chat = model.start_chat(history=[])

        print("--- İnteraktif Geliştirici Modu Başlatıldı ---")
        print(f"Bağlam Dosyası: {dosya_yolu}")
        print("Sohbetten çıkmak için 'çıkış' veya 'exit' yazın.")
        
        # İlk mesajı göndererek Gemini'ye bağlamı ver
        initial_prompt = f"""
        Merhaba. Seninle '{DOSYA_ADI}' dosyası üzerinde çalışacağız. 
        Dosyanın içeriğini sana aşağıda veriyorum. Bu içeriği aklında tut. 
        Sana bu dosya hakkında sorular soracağım. Hazır olduğunda 'Hazırım' de.

        --- DOSYA İÇERİĞİ ---
        {dosya_icerigi}
        ---
        """
        response = chat.send_message(initial_prompt)
        print(f"\nModel: {response.text}")

        # Kullanıcı ile interaktif sohbet döngüsü
        while True:
            user_input = input("Siz: ").strip()
            if user_input.lower() in ["çıkış", "exit"]:
                print("Oturum sonlandırıldı.")
                break

            response = chat.send_message(user_input)
            print(f"Model: {response.text}")

    except FileNotFoundError:
        print(f"HATA: Belirtilen dosya bulunamadı: '{dosya_yolu}'")
    except Exception as e:
        print(f"Beklenmedik bir hata oluştu: {e}")

if __name__ == "__main__":
    start_interactive_session()