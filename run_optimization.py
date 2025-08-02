# run_optimization.py - Manuel Optimizasyon Çalıştırıcı

from app import app, db
from optimizer import ComparisonAnalyzer

def run_manual_optimization(kategori='eczane'):
    """Manuel optimizasyon çalıştır"""
    print(f"🎯 {kategori.upper()} kategorisi için optimizasyon başlatılıyor...")
    
    with app.app_context():
        try:
            # Analyzer oluştur
            analyzer = ComparisonAnalyzer(db.session)
            
            # Optimizasyonu çalıştır
            result = analyzer.run_optimization(kategori)
            
            print("\n" + "="*50)
            print("📊 OPTİMİZASYON SONUÇLARI")
            print("="*50)
            
            if result['success']:
                print(f"✅ Optimizasyon başarılı!")
                print(f"📈 Karşılaştırma sayısı: {result['comparison_count']}")
                print(f"🎯 Önceki doğruluk oranı: {result['accuracy_before']:.2%}")
                print(f"⚠️  Tutarsızlık sayısı: {result['inconsistencies_count']}")
                print(f"🔧 Güncellenen parametre sayısı: {result['parameters_updated']}")
                print(f"⏰ Zaman: {result['timestamp']}")
                
                print(f"\n🎉 Parametreler başarıyla optimize edildi!")
                print(f"💡 Artık yeni skorlamalar güncellenmiş parametreleri kullanacak.")
                
            else:
                print(f"❌ Optimizasyon başarısız!")
                if 'message' in result:
                    print(f"   Sebep: {result['message']}")
                print(f"   Detaylar: {result}")
                
        except Exception as e:
            print(f"❌ Hata oluştu: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    run_manual_optimization('eczane')