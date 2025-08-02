# test_system.py - Parametre Optimizasyon Sistemi Testleri

import unittest
import json
from app import app, db, Grid, Karsilastirma, OptimizasyonLog, Kural
from optimizer import ComparisonAnalyzer

class ParameterOptimizationTestCase(unittest.TestCase):
    
    def setUp(self):
        """Test öncesi kurulum"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        db.create_all()
        
        # Test verileri oluştur
        self._create_test_data()
    
    def tearDown(self):
        """Test sonrası temizlik"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def _create_test_data(self):
        """Test için örnek veriler oluştur"""
        # Test grid noktaları
        grid1 = Grid(lat=39.96, lon=32.75, mahalle="Test Mahalle 1", aktif=True)
        grid2 = Grid(lat=39.97, lon=32.76, mahalle="Test Mahalle 2", aktif=True)
        grid3 = Grid(lat=39.98, lon=32.77, mahalle=None, aktif=True)  # Mahallesi yok
        
        # Test kuralları
        kural1 = Kural(isletme_turu='eczane', parametre='hastane', max_puan=80, etki_mesafesi=1000, log_katsayisi=1.5, aktif=True)
        kural2 = Kural(isletme_turu='eczane', parametre='rakip_eczane', max_puan=-100, etki_mesafesi=700, log_katsayisi=3.0, aktif=True)
        
        db.session.add_all([grid1, grid2, grid3, kural1, kural2])
        db.session.commit()
    
    def test_grid_validation(self):
        """Grid nokta validasyon testleri"""
        from app import get_valid_grid_points, validate_grid_point
        
        # Geçerli grid noktalarını al
        valid_grids = get_valid_grid_points()
        self.assertEqual(len(valid_grids), 2)  # Sadece mahallesi olan 2 nokta
        
        # Grid nokta validasyonu
        grid_with_mahalle = Grid.query.filter(Grid.mahalle.isnot(None)).first()
        is_valid, message = validate_grid_point(grid_with_mahalle)
        self.assertTrue(is_valid)
        
        grid_without_mahalle = Grid.query.filter(Grid.mahalle.is_(None)).first()
        is_valid, message = validate_grid_point(grid_without_mahalle)
        self.assertFalse(is_valid)
    
    def test_comparison_pair_api(self):
        """Karşılaştırma çifti API testi"""
        response = self.app.get('/api/v6/get_comparison_pair/eczane')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('nokta_A', data)
        self.assertIn('nokta_B', data)
        self.assertIn('lat', data['nokta_A'])
        self.assertIn('lon', data['nokta_A'])
        self.assertIn('mahalle', data['nokta_A'])
    
    def test_save_comparison_api(self):
        """Karşılaştırma kaydetme API testi"""
        # Önce grid noktalarını al
        grid1 = Grid.query.filter(Grid.mahalle.isnot(None)).first()
        grid2 = Grid.query.filter(Grid.mahalle.isnot(None)).offset(1).first()
        
        comparison_data = {
            'kategori': 'eczane',
            'nokta_A_id': grid1.id,
            'nokta_B_id': grid2.id,
            'secim': 'A_daha_iyi',
            'notlar': 'Test notu',
            'nokta_A_skor': 50.0,
            'nokta_B_skor': 30.0
        }
        
        response = self.app.post('/api/v6/save_comparison',
                               data=json.dumps(comparison_data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        
        # Veritabanında kaydedildi mi kontrol et
        comparison = Karsilastirma.query.first()
        self.assertIsNotNone(comparison)
        self.assertEqual(comparison.secim, 'A_daha_iyi')
        self.assertEqual(comparison.kategori, 'eczane')
    
    def test_comparison_stats_api(self):
        """Karşılaştırma istatistikleri API testi"""
        # Önce bir karşılaştırma ekle
        grid1 = Grid.query.filter(Grid.mahalle.isnot(None)).first()
        grid2 = Grid.query.filter(Grid.mahalle.isnot(None)).offset(1).first()
        
        comparison = Karsilastirma(
            nokta_a_lat=grid1.lat,
            nokta_a_lon=grid1.lon,
            nokta_b_lat=grid2.lat,
            nokta_b_lon=grid2.lon,
            secim='A_daha_iyi',
            kategori='eczane'
        )
        db.session.add(comparison)
        db.session.commit()
        
        response = self.app.get('/api/v6/comparison_stats')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['total_comparisons'], 1)
        self.assertFalse(data['ready_for_optimization'])  # 100'den az
    
    def test_comparison_analyzer(self):
        """Karşılaştırma analiz motoru testi"""
        # Test karşılaştırmaları ekle
        comparisons = [
            Karsilastirma(nokta_a_lat=39.96, nokta_a_lon=32.75, nokta_b_lat=39.97, nokta_b_lon=32.76,
                         secim='A_daha_iyi', kategori='eczane', nokta_a_skor=80, nokta_b_skor=60),
            Karsilastirma(nokta_a_lat=39.97, nokta_a_lon=32.76, nokta_b_lat=39.98, nokta_b_lon=32.77,
                         secim='B_daha_iyi', kategori='eczane', nokta_a_skor=40, nokta_b_skor=70),
        ]
        
        for comp in comparisons:
            db.session.add(comp)
        db.session.commit()
        
        # Analiz motoru testi
        analyzer = ComparisonAnalyzer(db.session)
        comparison_data = analyzer.collect_comparison_data('eczane')
        
        self.assertEqual(len(comparison_data), 2)
        
        # Doğruluk analizi
        accuracy_analysis = analyzer.analyze_scoring_accuracy(comparison_data)
        self.assertIn('accuracy', accuracy_analysis)
        self.assertIn('total', accuracy_analysis)
        self.assertIn('inconsistencies', accuracy_analysis)
    
    def test_parameter_adjustments(self):
        """Parametre ayarlama testi"""
        # Test karşılaştırmaları ekle (tutarsız)
        comparisons = [
            Karsilastirma(nokta_a_lat=39.96, nokta_a_lon=32.75, nokta_b_lat=39.97, nokta_b_lon=32.76,
                         secim='B_daha_iyi', kategori='eczane', nokta_a_skor=80, nokta_b_skor=60),  # Tutarsız
        ]
        
        for comp in comparisons:
            db.session.add(comp)
        db.session.commit()
        
        analyzer = ComparisonAnalyzer(db.session)
        comparison_data = analyzer.collect_comparison_data('eczane')
        accuracy_analysis = analyzer.analyze_scoring_accuracy(comparison_data)
        
        # Parametre ayarlamaları hesapla
        adjustments = analyzer.calculate_parameter_adjustments('eczane', accuracy_analysis['inconsistencies'])
        
        self.assertGreater(len(adjustments), 0)
        
        # Her ayarlama için gerekli alanları kontrol et
        for param_key, adjustment in adjustments.items():
            self.assertIn('rule_id', adjustment)
            self.assertIn('current_max_puan', adjustment)
            self.assertIn('suggested_max_puan', adjustment)
    
    def test_optimization_history_api(self):
        """Optimizasyon geçmişi API testi"""
        # Test optimizasyon logu ekle
        log_entry = OptimizasyonLog(
            kategori='eczane',
            karsilastirma_sayisi=50,
            degisiklik_detayi='Test optimizasyonu',
            basari_durumu=True
        )
        db.session.add(log_entry)
        db.session.commit()
        
        response = self.app.get('/api/v6/optimization_history')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(len(data['history']), 1)
        self.assertEqual(data['history'][0]['kategori'], 'eczane')

class IntegrationTestCase(unittest.TestCase):
    """Entegrasyon testleri"""
    
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        db.create_all()
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def test_full_comparison_workflow(self):
        """Tam karşılaştırma iş akışı testi"""
        # 1. Grid noktaları ekle
        grid1 = Grid(lat=39.96, lon=32.75, mahalle="Test Mahalle 1", aktif=True)
        grid2 = Grid(lat=39.97, lon=32.76, mahalle="Test Mahalle 2", aktif=True)
        
        # 2. Kurallar ekle
        kural = Kural(isletme_turu='eczane', parametre='hastane', max_puan=80, etki_mesafesi=1000, log_katsayisi=1.5, aktif=True)
        
        db.session.add_all([grid1, grid2, kural])
        db.session.commit()
        
        # 3. Karşılaştırma çifti al
        response = self.app.get('/api/v6/get_comparison_pair/eczane')
        self.assertEqual(response.status_code, 200)
        
        # 4. Karşılaştırma kaydet
        comparison_data = {
            'kategori': 'eczane',
            'nokta_A_id': grid1.id,
            'nokta_B_id': grid2.id,
            'secim': 'A_daha_iyi',
            'nokta_A_skor': 50.0,
            'nokta_B_skor': 30.0
        }
        
        response = self.app.post('/api/v6/save_comparison',
                               data=json.dumps(comparison_data),
                               content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # 5. İstatistikleri kontrol et
        response = self.app.get('/api/v6/comparison_stats')
        data = json.loads(response.data)
        self.assertEqual(data['total_comparisons'], 1)

if __name__ == '__main__':
    # Test suite oluştur
    test_suite = unittest.TestSuite()
    
    # Test sınıflarını ekle
    test_suite.addTest(unittest.makeSuite(ParameterOptimizationTestCase))
    test_suite.addTest(unittest.makeSuite(IntegrationTestCase))
    
    # Test runner
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Sonuçları yazdır
    print(f"\n{'='*50}")
    print(f"Test Sonuçları:")
    print(f"Toplam Test: {result.testsRun}")
    print(f"Başarılı: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Başarısız: {len(result.failures)}")
    print(f"Hata: {len(result.errors)}")
    print(f"{'='*50}")