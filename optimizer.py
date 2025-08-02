# optimizer.py - Parametre Optimizasyon Motoru

import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComparisonAnalyzer:
    """Karşılaştırma verilerini analiz ederek parametre optimizasyonu yapar"""
    
    def __init__(self, db_session):
        self.db = db_session
        self.comparison_data = []
        self.current_rules = {}
        self.optimization_threshold = 100
        
    def collect_comparison_data(self, kategori: str) -> List[Dict]:
        """Belirtilen kategori için karşılaştırma verilerini toplar"""
        from app import Karsilastirma
        
        comparisons = Karsilastirma.query.filter_by(kategori=kategori).all()
        
        data = []
        for comp in comparisons:
            data.append({
                'id': comp.id,
                'nokta_a_lat': comp.nokta_a_lat,
                'nokta_a_lon': comp.nokta_a_lon,
                'nokta_b_lat': comp.nokta_b_lat,
                'nokta_b_lon': comp.nokta_b_lon,
                'nokta_a_skor': comp.nokta_a_skor,
                'nokta_b_skor': comp.nokta_b_skor,
                'secim': comp.secim,
                'tarih': comp.tarih
            })
        
        logger.info(f"{kategori} kategorisi için {len(data)} karşılaştırma verisi toplandı")
        return data
    
    def analyze_scoring_accuracy(self, comparison_data: List[Dict]) -> Dict:
        """Mevcut skorlama sisteminin doğruluğunu analiz eder"""
        
        if not comparison_data:
            return {'accuracy': 0, 'total': 0, 'correct': 0, 'inconsistencies': []}
        
        correct_predictions = 0
        total_comparisons = len(comparison_data)
        inconsistencies = []
        
        for comp in comparison_data:
            skor_a = comp['nokta_a_skor'] or 0
            skor_b = comp['nokta_b_skor'] or 0
            secim = comp['secim']
            
            # Skorlara göre beklenen karar
            skor_farki = skor_a - skor_b
            
            if abs(skor_farki) < 5:  # Çok yakın skorlar
                expected = 'Esit'
            elif skor_farki > 20:
                expected = 'A_cok_daha_iyi'
            elif skor_farki > 5:
                expected = 'A_daha_iyi'
            elif skor_farki < -20:
                expected = 'B_cok_daha_iyi'
            elif skor_farki < -5:
                expected = 'B_daha_iyi'
            else:
                expected = 'Esit'
            
            # Gerçek karar ile karşılaştır
            if expected == secim:
                correct_predictions += 1
            else:
                inconsistencies.append({
                    'id': comp['id'],
                    'skor_a': skor_a,
                    'skor_b': skor_b,
                    'skor_farki': skor_farki,
                    'expected': expected,
                    'actual': secim,
                    'tarih': comp['tarih']
                })
        
        accuracy = correct_predictions / total_comparisons if total_comparisons > 0 else 0
        
        return {
            'accuracy': accuracy,
            'total': total_comparisons,
            'correct': correct_predictions,
            'inconsistencies': inconsistencies
        }
    
    def calculate_parameter_adjustments(self, kategori: str, inconsistencies: List[Dict]) -> Dict:
        """Tutarsızlıklara dayanarak parametre ayarlamalarını hesaplar"""
        from app import Kural
        
        # Mevcut kuralları al
        current_rules = Kural.query.filter_by(isletme_turu=kategori, aktif=True).all()
        
        adjustments = {}
        
        # Her kural için ayarlama önerisi hesapla
        for rule in current_rules:
            param_key = f"{rule.parametre}_{rule.deger}" if rule.deger else rule.parametre
            
            # Basit ayarlama algoritması
            # Tutarsızlık sayısına göre parametre değerlerini ayarla
            inconsistency_count = len(inconsistencies)
            
            if inconsistency_count > 20:  # Çok fazla tutarsızlık
                adjustment_factor = 0.8  # %20 azalt
            elif inconsistency_count > 10:  # Orta düzey tutarsızlık
                adjustment_factor = 0.9  # %10 azalt
            else:
                adjustment_factor = 1.0  # Değişiklik yok
            
            adjustments[param_key] = {
                'rule_id': rule.id,
                'current_max_puan': rule.max_puan,
                'suggested_max_puan': rule.max_puan * adjustment_factor,
                'current_etki_mesafesi': rule.etki_mesafesi,
                'suggested_etki_mesafesi': rule.etki_mesafesi,
                'current_log_katsayisi': rule.log_katsayisi,
                'suggested_log_katsayisi': rule.log_katsayisi,
                'adjustment_reason': f"Tutarsızlık sayısı: {inconsistency_count}"
            }
        
        logger.info(f"{kategori} kategorisi için {len(adjustments)} parametre ayarlaması hesaplandı")
        return adjustments
    
    def apply_parameter_updates(self, kategori: str, adjustments: Dict) -> bool:
        """Hesaplanan parametre ayarlamalarını veritabanına uygular"""
        try:
            # Import'ları fonksiyon içinde yap
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            
            updated_count = 0
            changes_detail = []
            
            for param_key, adjustment in adjustments.items():
                # Raw SQL kullanarak güncelle
                rule_id = adjustment['rule_id']
                new_value = adjustment['suggested_max_puan']
                
                # Mevcut değeri al
                from sqlalchemy import text
                result = self.db.execute(text(f"SELECT max_puan, parametre FROM kural WHERE id = {rule_id}"))
                row = result.fetchone()
                
                if row:
                    old_value = row[0]
                    parametre = row[1]
                    
                    if abs(old_value - new_value) > 0.1:  # Anlamlı değişiklik varsa
                        self.db.execute(text(f"UPDATE kural SET max_puan = {new_value} WHERE id = {rule_id}"))
                        updated_count += 1
                        
                        changes_detail.append(f"{parametre}: {old_value:.1f} → {new_value:.1f}")
            
            # Optimizasyon logunu kaydet
            comparison_count = len(self.comparison_data)
            from sqlalchemy import text
            self.db.execute(text(f"""
                INSERT INTO optimizasyon_log (kategori, karsilastirma_sayisi, degisiklik_detayi, basari_durumu, tarih)
                VALUES ('{kategori}', {comparison_count}, '{"; ".join(changes_detail)}', 1, datetime('now'))
            """))
            
            self.db.commit()
            
            logger.info(f"{kategori} kategorisi için {updated_count} parametre güncellendi")
            return True
            
        except Exception as e:
            logger.error(f"Parametre güncellemesi sırasında hata: {str(e)}")
            self.db.rollback()
            return False
    
    def run_optimization(self, kategori: str) -> Dict:
        """Tam optimizasyon sürecini çalıştırır"""
        logger.info(f"{kategori} kategorisi için optimizasyon başlatılıyor...")
        
        # 1. Karşılaştırma verilerini topla
        self.comparison_data = self.collect_comparison_data(kategori)
        
        if len(self.comparison_data) < self.optimization_threshold:
            return {
                'success': False,
                'message': f"Optimizasyon için en az {self.optimization_threshold} karşılaştırma gerekli. Mevcut: {len(self.comparison_data)}"
            }
        
        # 2. Skorlama doğruluğunu analiz et
        accuracy_analysis = self.analyze_scoring_accuracy(self.comparison_data)
        
        # 3. Parametre ayarlamalarını hesapla
        adjustments = self.calculate_parameter_adjustments(kategori, accuracy_analysis['inconsistencies'])
        
        # 4. Parametreleri güncelle
        update_success = self.apply_parameter_updates(kategori, adjustments)
        
        result = {
            'success': update_success,
            'kategori': kategori,
            'comparison_count': len(self.comparison_data),
            'accuracy_before': accuracy_analysis['accuracy'],
            'inconsistencies_count': len(accuracy_analysis['inconsistencies']),
            'parameters_updated': len(adjustments),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Optimizasyon tamamlandı: {result}")
        return result

def check_and_run_optimization(db_session, kategori: str = 'eczane') -> Optional[Dict]:
    """Optimizasyon gerekli mi kontrol eder ve gerekirse çalıştırır"""
    from app import Karsilastirma
    
    # Karşılaştırma sayısını kontrol et
    comparison_count = Karsilastirma.query.filter_by(kategori=kategori).count()
    
    if comparison_count >= 100:  # Threshold
        analyzer = ComparisonAnalyzer(db_session)
        return analyzer.run_optimization(kategori)
    
    return None