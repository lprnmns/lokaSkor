# app.py (V6.0 - Parametre Optimizasyon Sistemi ile)

import os
import pandas as pd
from datetime import datetime
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

# --- OpenStreetMap Veri Kontrolü ---
def check_osm_data():
    """OpenStreetMap verilerini kontrol et, yoksa çek"""
    import glob
    import subprocess
    import sys
    
    osm_files = glob.glob('*_osm.csv')
    
    if not osm_files:
        print("\n⚠️ OpenStreetMap verileri bulunamadı. Veriler çekiliyor...")
        try:
            # fetch_osm_data.py dosyasının tam yolunu belirle
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fetch_osm_data.py')
            print(f"OSM veri çekici yolu: {script_path}")
            
            if os.path.exists(script_path):
                print("OSM veri çekici bulundu, çalıştırılıyor...")
                result = subprocess.run([sys.executable, script_path], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0:
                    print("OpenStreetMap verileri başarıyla çekildi!\n")
                else:
                    print(f"OSM veri çekme hatası: {result.stderr}")
                    print("Mevcut CSV dosyaları kullanılacak.\n")
            else:
                print(f"❌ fetch_osm_data.py dosyası bulunamadı: {script_path}")
                print("Mevcut CSV dosyaları kullanılacak.\n")
        except Exception as e:
            print(f"\n❌ OpenStreetMap verileri çekilemedi: {str(e)}")
            print("Mevcut CSV dosyaları kullanılacak.\n")
    else:
        print(f"✅ OpenStreetMap verileri mevcut: {len(osm_files)} dosya bulundu")

# Uygulama başlarken OSM verilerini kontrol et
check_osm_data()

# Backend modüllerimiz
from data_manager import data_manager
from scorer import score_single_point

# --- 1. Kurulum ---
app = Flask(__name__)
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'parameter_optimization.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SECRET_KEY'] = 'my-super-secret-key-v5.1'
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
db = SQLAlchemy(app)

# Cache-busting headers
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = "0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Last-Modified"] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    return response
admin = Admin(app, name='Lokasyon Zekası Platformu', template_mode='bootstrap4')

# --- 2. Veritabanı Modelleri ---
class Kural(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    isletme_turu = db.Column(db.String(50), nullable=False, index=True)
    parametre = db.Column(db.String(50), nullable=False)
    max_puan = db.Column(db.Float, default=0)
    etki_mesafesi = db.Column(db.Integer, default=1000)
    log_katsayisi = db.Column(db.Float, default=2.0)
    deger = db.Column(db.String(100), nullable=True)
    aktif = db.Column(db.Boolean, default=True)
    def __repr__(self): return f"{self.isletme_turu} -> {self.parametre}"

class Grid(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)
    mahalle = db.Column(db.String(100), nullable=True)
    aktif = db.Column(db.Boolean, default=True)
    def __repr__(self): return f"Grid({self.lat:.4f}, {self.lon:.4f}) - {self.mahalle}"

class Karsilastirma(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nokta_a_lat = db.Column(db.Float, nullable=False)
    nokta_a_lon = db.Column(db.Float, nullable=False)
    nokta_b_lat = db.Column(db.Float, nullable=False)
    nokta_b_lon = db.Column(db.Float, nullable=False)
    secim = db.Column(db.String(20), nullable=False)  # A_cok_daha_iyi, A_daha_iyi, Esit, B_daha_iyi, B_cok_daha_iyi
    kategori = db.Column(db.String(50), nullable=False)
    notlar = db.Column(db.Text, nullable=True)
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    nokta_a_skor = db.Column(db.Float, nullable=True)
    nokta_b_skor = db.Column(db.Float, nullable=True)
    def __repr__(self): return f"Karsilastirma({self.kategori}) - {self.secim}"

class OptimizasyonLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
    kategori = db.Column(db.String(50), nullable=False)
    karsilastirma_sayisi = db.Column(db.Integer, nullable=False)
    degisiklik_detayi = db.Column(db.Text, nullable=True)
    basari_durumu = db.Column(db.Boolean, default=True)
    def __repr__(self): return f"OptimizasyonLog({self.kategori}) - {self.tarih.strftime('%Y-%m-%d')}"

class WeightConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, unique=True)  # eczane, cafe, etc.
    hospital_weight = db.Column(db.Float, default=0.30)
    competitor_weight = db.Column(db.Float, default=0.30)
    demographics_weight = db.Column(db.Float, default=0.10)
    important_places_weight = db.Column(db.Float, default=0.30)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def __repr__(self): return f"WeightConfig({self.category})"

class ParameterConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    parameter_type = db.Column(db.String(50), nullable=False)  # hastane, rakip_eczane, etc.
    max_score = db.Column(db.Float, nullable=False)
    effect_distance = db.Column(db.Integer, nullable=False)  # meters
    log_coefficient = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def __repr__(self): return f"ParameterConfig({self.category}-{self.parameter_type})"

# --- Advanced Admin Models ---
class AdvancedParameter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    parameter_name = db.Column(db.String(100), nullable=False)
    parameter_type = db.Column(db.String(50), nullable=False)  # distance, demographic, weight
    max_score = db.Column(db.Float, nullable=False)
    effect_distance = db.Column(db.Integer, nullable=True)  # For distance-based parameters
    log_coefficient = db.Column(db.Float, nullable=True)  # For distance-based parameters
    categorical_values = db.Column(db.JSON, nullable=True)  # For demographic parameters
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self): 
        return f"AdvancedParameter({self.category}-{self.parameter_name})"
    
    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'parameter_name': self.parameter_name,
            'parameter_type': self.parameter_type,
            'max_score': self.max_score,
            'effect_distance': self.effect_distance,
            'log_coefficient': self.log_coefficient,
            'categorical_values': self.categorical_values,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class TestPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    expected_score = db.Column(db.Float, nullable=True)
    is_predefined = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self): 
        return f"TestPoint({self.name} - {self.category})"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'lat': self.lat,
            'lon': self.lon,
            'category': self.category,
            'expected_score': self.expected_score,
            'is_predefined': self.is_predefined,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ParameterHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parameter_id = db.Column(db.Integer, db.ForeignKey('advanced_parameter.id'), nullable=False)
    old_value = db.Column(db.JSON, nullable=False)
    new_value = db.Column(db.JSON, nullable=False)
    changed_by = db.Column(db.String(100), nullable=True)
    change_reason = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    parameter = db.relationship('AdvancedParameter', backref=db.backref('history', lazy=True))
    
    def __repr__(self): 
        return f"ParameterHistory({self.parameter_id} - {self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    def to_dict(self):
        return {
            'id': self.id,
            'parameter_id': self.parameter_id,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'changed_by': self.changed_by,
            'change_reason': self.change_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# --- 3. Admin Paneli Görünümü ---
class KuralAdminView(ModelView):
    column_list = ('isletme_turu', 'parametre', 'max_puan', 'etki_mesafesi', 'log_katsayisi', 'deger', 'aktif')
    column_labels = {'isletme_turu': 'İşletme Kategorisi', 'parametre': 'Puan Parametresi', 'max_puan': 'Maksimum Puan (0m\'de)', 'etki_mesafesi': 'Etki Mesafesi (m)', 'log_katsayisi': 'Log. Düşüş Katsayısı', 'deger': 'Kategorik Değer', 'aktif': 'Aktif mi?'}
    column_filters = ['isletme_turu', 'parametre']
    column_editable_list = ('max_puan', 'etki_mesafesi', 'log_katsayisi', 'aktif')
    form_columns = ('isletme_turu', 'parametre', 'max_puan', 'etki_mesafesi', 'log_katsayisi', 'deger', 'aktif')

class GridAdminView(ModelView):
    column_list = ('id', 'lat', 'lon', 'mahalle', 'aktif')
    column_labels = {'lat': 'Enlem', 'lon': 'Boylam', 'mahalle': 'Mahalle', 'aktif': 'Aktif mi?'}
    column_filters = ['mahalle', 'aktif']
    column_searchable_list = ['mahalle']
    can_create = False  # Grid noktaları otomatik yüklenir
    can_delete = False

class KarsilastirmaAdminView(ModelView):
    column_list = ('id', 'kategori', 'secim', 'tarih', 'nokta_a_skor', 'nokta_b_skor')
    column_labels = {'kategori': 'Kategori', 'secim': 'Seçim', 'tarih': 'Tarih', 'nokta_a_skor': 'A Skoru', 'nokta_b_skor': 'B Skoru', 'notlar': 'Notlar'}
    column_filters = ['kategori', 'secim', 'tarih']
    column_default_sort = ('tarih', True)
    can_create = False  # Karşılaştırmalar sadece compare sayfasından yapılır
    can_edit = False

class OptimizasyonLogAdminView(ModelView):
    column_list = ('id', 'kategori', 'tarih', 'karsilastirma_sayisi', 'basari_durumu')
    column_labels = {'kategori': 'Kategori', 'tarih': 'Tarih', 'karsilastirma_sayisi': 'Karşılaştırma Sayısı', 'basari_durumu': 'Başarılı mı?', 'degisiklik_detayi': 'Değişiklik Detayı'}
    column_filters = ['kategori', 'basari_durumu', 'tarih']
    column_default_sort = ('tarih', True)
    can_create = False  # Loglar otomatik oluşturulur
    can_edit = False
    can_delete = False

admin.add_view(KuralAdminView(Kural, db.session, name="Skorlama Kuralları"))
admin.add_view(GridAdminView(Grid, db.session, name="Grid Noktaları"))
admin.add_view(KarsilastirmaAdminView(Karsilastirma, db.session, name="Karşılaştırmalar"))
admin.add_view(OptimizasyonLogAdminView(OptimizasyonLog, db.session, name="Optimizasyon Geçmişi"))

# --- 4. Web Rotaları ---
@app.route('/')
def index():
    import time
    return render_template('anasayfa.html', timestamp=int(time.time()))

@app.route('/modern')
def modern_dashboard():
    import time
    return render_template('modern_dashboard.html', timestamp=int(time.time()))

@app.route('/compare')
def compare():
    return render_template('compare.html')

# --- New Modern UI Routes ---
@app.route('/new-ui')
@app.route('/landing')
def new_landing():
    """Modern UI Landing Page"""
    return render_template('landing.html')

@app.route('/business-selection')
def business_selection():
    """Business Type Selection Page"""
    return render_template('business_selection.html')

@app.route('/mode-selection')
def mode_selection():
    """Analysis Mode Selection Page"""
    return render_template('mode_selection.html')

@app.route('/analysis-dashboard')
def analysis_dashboard():
    """Main Analysis Dashboard"""
    return render_template('analysis_dashboard.html')

@app.route('/mod1-comparison')
def mod1_comparison():
    """Mod1: Belirli Dükkanları Karşılaştır"""
    business_type = request.args.get('business_type', 'genel')
    return render_template('mod1_location_comparison.html', business_type=business_type)

@app.route('/api/compare-locations', methods=['POST'])
def compare_locations():
    """API endpoint for location comparison analysis"""
    try:
        data = request.get_json()
        locations = data.get('locations', [])
        business_type = data.get('business_type', 'genel')
        
        if len(locations) < 2:
            return jsonify({'error': 'En az 2 lokasyon gerekli'}), 400
        
        # Retrieve Google Maps API key
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        # Perform analysis for each location
        results = []
        for i, location in enumerate(locations):
            # Use enhanced analysis functions
            analysis = analyze_location_score(location['lat'], location['lng'], business_type)
            
            # Construct Street View URL if API key is available
            street_view_url = None
            if api_key:
                try:
                    lat = location['lat']
                    lng = location['lng']
                    street_view_url = f"https://maps.googleapis.com/maps/api/streetview?size=600x300&location={lat},{lng}&fov=90&key={api_key}"
                except Exception as e:
                    # If URL construction fails, street_view_url will remain None
                    print(f"Street View URL construction failed for location {location.get('id', 'unknown')}: {str(e)}")
            
            result = {
                'id': location['id'],
                'name': location['name'],
                'lat': location['lat'],
                'lng': location['lng'],
                'address': location.get('address', ''),
                'coordinates': {'lat': location['lat'], 'lng': location['lng']},
                'totalScore': analysis['total_score'],
                'rank': 0,  # Will be calculated after all scores
                'scores': analysis['scores'],
                'details': analysis['details'],
                'streetViewImageUrl': street_view_url
            }
            results.append(result)
        
        # Calculate ranks
        results.sort(key=lambda x: x['totalScore'], reverse=True)
        for i, result in enumerate(results):
            result['rank'] = i + 1
        
        return jsonify({
            'success': True,
            'locations': results,
            'business_type': business_type,
            'analysis_date': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Location comparison error: {str(e)}")
        return jsonify({'error': 'Analiz sırasında hata oluştu'}), 500

def analyze_location_score(lat, lng, business_type):
    """Analyze a single location using the same algorithm as modern dashboard"""
    try:
        # Use the real scoring algorithm from scorer.py (already imported at top)
        
        # Get rules for the business type from database
        kurallar = Kural.query.filter_by(isletme_turu=business_type, aktif=True).all()
        
        if not kurallar:
            # Fallback to default rules if no specific rules found
            print(f"Warning: No rules found for business type '{business_type}', using default scoring")
            kurallar = Kural.query.filter_by(aktif=True).limit(10).all()
        
        # Use the real scoring algorithm from scorer.py
        result = score_single_point(lat, lng, business_type, kurallar)
        
        if 'error' in result:
            raise Exception(result['error'])
        
        # Extract scores from the detailed breakdown
        breakdown = result.get('breakdown', {})
        
        # Map the detailed scores to Mod1 format
        hospital_score = breakdown.get('hospital_proximity', {}).get('score', 0)
        competitor_score = breakdown.get('competitors', {}).get('score', 0)
        important_places_score = breakdown.get('important_places', {}).get('score', 0)
        demographic_score = breakdown.get('demographics', {}).get('score', 0)
        
        # Get detailed information from breakdown - Format for JavaScript compatibility
        nearby_places = {
            'hospital': {
                'name': 'Hastane',
                'distance': breakdown.get('hospital_distance', 'Bilinmiyor')
            } if breakdown.get('hospital_distance') else {
                'name': 'Hastane bulunamadı',
                'distance': 'N/A'
            },
            'metro': {
                'name': 'Metro',
                'distance': breakdown.get('metro_distance', 'Bilinmiyor')
            } if breakdown.get('metro_distance') else {
                'name': 'Metro bulunamadı',
                'distance': 'N/A'
            },
            'pharmacy': {
                'name': 'Market/Eczane',
                'distance': breakdown.get('market_distance', breakdown.get('competitor_distance', 'Bilinmiyor'))
            } if breakdown.get('market_distance') or breakdown.get('competitor_distance') else {
                'name': 'Market/Eczane bulunamadı',
                'distance': 'N/A'
            }
        }
        
        # Get demographic info
        demographic_details = breakdown.get('demographics', {}).get('details', {})
        demographic_info = {
            'population': demographic_details.get('population', 0),
            'age_profile': demographic_details.get('age_profile', 'Bilinmiyor'),
            'income_level': demographic_details.get('income_level', 'Bilinmiyor'),
            'population_density_score': demographic_details.get('population_density_score', 0),
            'age_score': demographic_details.get('age_score', 0),
            'income_score': demographic_details.get('income_score', 0)
        }
        
        # Get competitor info with error handling
        competitor_details = breakdown.get('competitors', {}).get('details', [])
        competitors = []
        try:
            if competitor_details and isinstance(competitor_details, list):
                # Sort by distance_meters and limit to 5 (already sorted in scorer.py, but ensure consistency)
                valid_competitors = [comp for comp in competitor_details if comp and isinstance(comp, dict)]
                sorted_competitors = sorted(valid_competitors, key=lambda x: x.get('distance_meters', 999999))[:5]
                
                for comp in sorted_competitors:
                    try:
                        competitors.append({
                            'name': str(comp.get('ad', 'Rakip İşletme')),
                            'distance': str(comp.get('mesafe', 'Bilinmiyor')),
                            'distance_meters': int(comp.get('distance_meters', 999999)) if comp.get('distance_meters') is not None else 999999,
                            'impact_score': float(str(comp.get('puan', '0')).replace('+', '')) if comp.get('puan') else 0
                        })
                    except (ValueError, TypeError) as e:
                        print(f"Warning: Invalid competitor data: {comp}, error: {e}")
                        # Add fallback competitor entry
                        competitors.append({
                            'name': 'Rakip İşletme',
                            'distance': 'Bilinmiyor',
                            'distance_meters': 999999,
                            'impact_score': 0
                        })
        except Exception as e:
            print(f"Error processing competitor details: {e}")
            competitors = []  # Return empty list on error
        
        # Important places analysis
        important_places_details = breakdown.get('important_places', {}).get('details', {})
        important_places = {
            'metro_score': important_places_details.get('metro_score', 0),
            'university_score': important_places_details.get('university_score', 0),
            'mall_score': important_places_details.get('mall_score', 0),
            'metro_distance': breakdown.get('metro_distance', 'Bilinmiyor')
        }
        
        return {
            'total_score': result.get('total_score', 0),
            'scores': {
                'hospital': hospital_score,
                'competitor': competitor_score,
                'important': important_places_score,
                'demographic': demographic_score
            },
            'details': {
                'nearby_places': nearby_places,
                'demographic': demographic_info,
                'competitors': competitors,
                'important_places': important_places,
                'mahalle': result.get('mahalle', 'Bilinmiyor'),
                'category': result.get('category', 'Orta'),
                'raw_breakdown': breakdown  # Include full breakdown for debugging
            }
        }
        
    except Exception as e:
        print(f"Score calculation error: {str(e)}")
        # Return realistic mock data for testing
        return get_mock_analysis_data(lat, lng, business_type)

def calculate_hospital_proximity_score(lat, lng):
    """Calculate hospital proximity score"""
    try:
        # Use existing data manager to find nearest hospital
        hospitals = data_manager.get_nearby_hospitals(lat, lng, radius=2000)  # 2km radius
        if not hospitals:
            return 30  # Low score if no hospitals nearby
        
        nearest_distance = min(hospital.get('distance', 1000) for hospital in hospitals)
        
        # Score based on distance (closer = higher score)
        if nearest_distance <= 200:
            return 95
        elif nearest_distance <= 500:
            return 85
        elif nearest_distance <= 1000:
            return 70
        elif nearest_distance <= 1500:
            return 55
        else:
            return 40
            
    except Exception as e:
        print(f"Hospital score calculation error: {str(e)}")
        return 60

def calculate_competitor_analysis_score(lat, lng, business_type):
    """Calculate competitor analysis score"""
    try:
        competitors = data_manager.get_competitors(lat, lng, business_type, radius=1000)
        
        if not competitors:
            return 90  # High score if no competitors
        
        # Score based on number and proximity of competitors
        competitor_count = len(competitors)
        avg_distance = sum(comp.get('distance', 500) for comp in competitors) / competitor_count
        
        # Fewer competitors and farther distance = higher score
        distance_score = min(100, avg_distance / 10)  # Normalize distance
        count_penalty = max(0, 100 - (competitor_count * 15))  # Penalty for each competitor
        
        return max(20, min(100, (distance_score + count_penalty) / 2))
        
    except Exception as e:
        print(f"Competitor score calculation error: {str(e)}")
        return 65

def calculate_important_places_score(lat, lng):
    """Calculate important places score"""
    try:
        metro_score = calculate_metro_score(lat, lng)
        university_score = calculate_university_score(lat, lng)
        mall_score = calculate_mall_score(lat, lng)
        
        # Weighted average
        total_score = (metro_score * 0.4 + university_score * 0.3 + mall_score * 0.3)
        return min(100, total_score)
        
    except Exception as e:
        print(f"Important places score calculation error: {str(e)}")
        return 70

def calculate_metro_score(lat, lng):
    """Calculate metro proximity score"""
    try:
        metros = data_manager.get_nearby_metros(lat, lng, radius=1000)
        if not metros:
            return 20
        
        nearest_distance = min(metro.get('distance', 1000) for metro in metros)
        
        if nearest_distance <= 200:
            return 100
        elif nearest_distance <= 500:
            return 80
        elif nearest_distance <= 800:
            return 60
        else:
            return 30
            
    except Exception as e:
        return 50

def calculate_university_score(lat, lng):
    """Calculate university proximity score"""
    try:
        universities = data_manager.get_nearby_universities(lat, lng, radius=3000)
        if not universities:
            return 30
        
        nearest_distance = min(uni.get('distance', 2000) for uni in universities)
        
        if nearest_distance <= 1000:
            return 90
        elif nearest_distance <= 2000:
            return 70
        else:
            return 40
            
    except Exception as e:
        return 45

def calculate_mall_score(lat, lng):
    """Calculate mall proximity score"""
    try:
        malls = data_manager.get_nearby_malls(lat, lng, radius=2000)
        if not malls:
            return 25
        
        nearest_distance = min(mall.get('distance', 1500) for mall in malls)
        
        if nearest_distance <= 500:
            return 85
        elif nearest_distance <= 1000:
            return 65
        else:
            return 35
            
    except Exception as e:
        return 40

def calculate_demographic_score(lat, lng, business_type):
    """Calculate demographic compatibility score"""
    try:
        demographic_data = data_manager.get_demographic_data(lat, lng)
        
        population = demographic_data.get('population', 20000)
        age_profile = demographic_data.get('age_profile', 'mixed')
        income_level = demographic_data.get('income_level', 'medium')
        
        # Base score from population density
        pop_score = min(100, population / 500)  # Normalize population
        
        # Business type specific adjustments
        business_multipliers = {
            'eczane': {'elderly': 1.2, 'mixed': 1.0, 'young': 0.8},
            'market': {'elderly': 1.0, 'mixed': 1.1, 'young': 1.0},
            'cafe': {'elderly': 0.7, 'mixed': 1.0, 'young': 1.3},
            'restoran': {'elderly': 0.8, 'mixed': 1.1, 'young': 1.2}
        }
        
        age_multiplier = business_multipliers.get(business_type, {}).get(age_profile, 1.0)
        
        # Income level adjustments
        income_multipliers = {'low': 0.8, 'medium': 1.0, 'high': 1.2}
        income_multiplier = income_multipliers.get(income_level, 1.0)
        
        final_score = pop_score * age_multiplier * income_multiplier
        return min(100, max(20, final_score))
        
    except Exception as e:
        print(f"Demographic score calculation error: {str(e)}")
        return 65

def get_nearby_places(lat, lng):
    """Get nearby important places"""
    try:
        hospitals = data_manager.get_nearby_hospitals(lat, lng, radius=2000)
        metros = data_manager.get_nearby_metros(lat, lng, radius=1000)
        pharmacies = data_manager.get_nearby_pharmacies(lat, lng, radius=500)
        
        nearest_hospital = min(hospitals, key=lambda x: x.get('distance', 9999)) if hospitals else None
        nearest_metro = min(metros, key=lambda x: x.get('distance', 9999)) if metros else None
        nearest_pharmacy = min(pharmacies, key=lambda x: x.get('distance', 9999)) if pharmacies else None
        
        return {
            'hospital': {
                'name': nearest_hospital.get('name', 'Hastane bulunamadı') if nearest_hospital else 'Hastane bulunamadı',
                'distance': f"{nearest_hospital.get('distance', 0)}m" if nearest_hospital else 'N/A'
            },
            'metro': {
                'name': nearest_metro.get('name', 'Metro bulunamadı') if nearest_metro else 'Metro bulunamadı',
                'distance': f"{nearest_metro.get('distance', 0)}m" if nearest_metro else 'N/A'
            },
            'pharmacy': {
                'name': nearest_pharmacy.get('name', 'Eczane bulunamadı') if nearest_pharmacy else 'Eczane bulunamadı',
                'distance': f"{nearest_pharmacy.get('distance', 0)}m" if nearest_pharmacy else 'N/A'
            }
        }
    except Exception as e:
        print(f"Nearby places error: {str(e)}")
        return get_mock_nearby_places()

def get_demographic_info(lat, lng):
    """Get demographic information"""
    try:
        demographic_data = data_manager.get_demographic_data(lat, lng)
        return {
            'population': demographic_data.get('population', 25000),
            'age_profile': demographic_data.get('age_profile', 'Karma'),
            'income_level': demographic_data.get('income_level', 'Orta')
        }
    except Exception as e:
        print(f"Demographic info error: {str(e)}")
        return {'population': 25000, 'age_profile': 'Karma', 'income_level': 'Orta'}

def get_competitor_analysis(lat, lng, business_type):
    """Get competitor analysis"""
    try:
        competitors = data_manager.get_competitors(lat, lng, business_type, radius=1000)
        
        competitor_list = []
        for comp in competitors[:5]:  # Limit to 5 competitors
            distance = comp.get('distance', 500)
            # Calculate impact based on distance and business type
            impact = calculate_competitor_impact(distance, business_type)
            
            competitor_list.append({
                'name': comp.get('name', f'{business_type.title()} Rakibi'),
                'distance': f"{distance}m",
                'impact': round(impact, 1)
            })
        
        return competitor_list
        
    except Exception as e:
        print(f"Competitor analysis error: {str(e)}")
        return get_mock_competitors(business_type)

def calculate_competitor_impact(distance, business_type):
    """Calculate competitor impact on business"""
    # Closer competitors have more negative impact
    base_impact = -20 + (distance / 50)  # Base calculation
    
    # Business type specific adjustments
    if business_type == 'eczane':
        return max(-15, min(-2, base_impact))  # Pharmacies can coexist better
    elif business_type == 'market':
        return max(-25, min(-5, base_impact))  # Markets compete more
    else:
        return max(-20, min(-3, base_impact))

def get_important_places_analysis(lat, lng):
    """Get important places analysis"""
    try:
        metros = data_manager.get_nearby_metros(lat, lng, radius=1000)
        universities = data_manager.get_nearby_universities(lat, lng, radius=3000)
        malls = data_manager.get_nearby_malls(lat, lng, radius=2000)
        
        metro_list = []
        for metro in metros[:3]:
            distance = metro.get('distance', 500)
            score = max(5, 25 - (distance / 20))  # Score based on distance
            metro_name = metro.get('name', 'Metro İstasyonu')
            # Add "(Metro)" suffix if not already present
            if not metro_name.endswith('(Metro)') and not metro_name.endswith('Metro'):
                metro_name = f"{metro_name} (Metro)"
            metro_list.append({
                'name': metro_name,
                'distance': f"{distance}m",
                'score': round(score, 1)
            })
        
        university_list = []
        for uni in universities[:2]:
            distance = uni.get('distance', 1500)
            score = max(3, 30 - (distance / 50))
            university_list.append({
                'name': uni.get('name', 'Üniversite'),
                'distance': f"{distance}m",
                'score': round(score, 1)
            })
        
        mall_list = []
        for mall in malls[:3]:
            distance = mall.get('distance', 800)
            score = max(2, 20 - (distance / 40))
            mall_list.append({
                'name': mall.get('name', 'AVM'),
                'distance': f"{distance}m",
                'score': round(score, 1)
            })
        
        return {
            'metro': metro_list,
            'university': university_list,
            'mall': mall_list
        }
        
    except Exception as e:
        print(f"Important places analysis error: {str(e)}")
        return get_mock_important_places()

def get_mock_analysis_data(lat, lng, business_type):
    """Return realistic mock data for testing"""
    import random
    
    # Generate realistic scores with some randomness
    base_scores = {
        'hospital': random.randint(60, 90),
        'competitor': random.randint(50, 85),
        'important': random.randint(65, 95),
        'demographic': random.randint(70, 90)
    }
    
    total_score = sum(base_scores.values()) / 4
    
    return {
        'total_score': round(total_score, 1),
        'scores': base_scores,
        'details': {
            'nearby_places': get_mock_nearby_places(),
            'demographic': {
                'population': random.randint(20000, 50000),
                'age_profile': random.choice(['Genç Ağırlıklı', 'Yaşlı Ağırlıklı', 'Karma']),
                'income_level': random.choice(['Düşük', 'Orta', 'Yüksek'])
            },
            'competitors': get_mock_competitors(business_type),
            'important_places': get_mock_important_places()
        }
    }

def get_mock_nearby_places():
    """Mock nearby places data"""
    import random
    
    hospitals = ['Ankara Şehir Hastanesi', 'Hacettepe Hastanesi', 'Gazi Hastanesi', 'Numune Hastanesi']
    metros = ['Kızılay', 'Ulus', 'Çankaya', 'Bahçelievler', 'Hastane']  # Remove "Metro" suffix
    pharmacies = ['Sağlık Eczanesi', 'Merkez Eczanesi', 'Şifa Eczanesi', 'Doktor Eczanesi']
    
    # Add "(Metro)" suffix to metro names
    metro_name = random.choice(metros)
    if not metro_name.endswith('(Metro)'):
        metro_name = f"{metro_name} (Metro)"
    
    return {
        'hospital': {
            'name': random.choice(hospitals),
            'distance': f"{random.randint(200, 1500)}m"
        },
        'metro': {
            'name': metro_name,
            'distance': f"{random.randint(150, 800)}m"
        },
        'pharmacy': {
            'name': random.choice(pharmacies),
            'distance': f"{random.randint(100, 600)}m"
        }
    }

def get_mock_competitors(business_type):
    """Mock competitor data"""
    import random
    
    competitors = []
    for i in range(random.randint(1, 4)):
        distance = random.randint(200, 1000)
        impact = calculate_competitor_impact(distance, business_type)
        
        competitors.append({
            'name': f'{business_type.title()} Rakibi {i+1}',
            'distance': f"{distance}m",
            'impact': round(impact, 1)
        })
    
    return competitors

def get_mock_important_places():
    """Mock important places data"""
    import random
    
    return {
        'metro': [
            {
                'name': 'Kızılay Metro',
                'distance': f"{random.randint(200, 800)}m",
                'score': round(random.uniform(15, 25), 1)
            }
        ],
        'university': [
            {
                'name': 'Hacettepe Üniversitesi',
                'distance': f"{random.randint(800, 2500)}m",
                'score': round(random.uniform(8, 20), 1)
            }
        ],
        'mall': [
            {
                'name': 'Karum AVM',
                'distance': f"{random.randint(300, 1200)}m",
                'score': round(random.uniform(10, 18), 1)
            }
        ]
    }

@app.route('/animation-demo')
def animation_demo():
    """Animation Demo Page"""
    return render_template('animation_demo.html')

@app.route('/admin/compare')
def admin_compare_interface():
    """Admin comparison interface"""
    return render_template('admin/compare.html')

def check_basic_services(lat, lon):
    """Temel hizmetlerin 2km içinde olup olmadığını kontrol eder"""
    import numpy as np
    from shapely.geometry import Point
    import geopandas as gpd
    
    # Noktayı UTM'ye çevir
    point_wgs84 = gpd.GeoDataFrame(geometry=[Point(lon, lat)], crs="EPSG:4326")
    point_utm = point_wgs84.to_crs(epsg=32636).iloc[0].geometry
    point_coords = (point_utm.x, point_utm.y)
    
    # Temel hizmetler
    temel_hizmetler = ['hastane', 'okul', 'market', 'metro']
    yakin_hizmet_sayisi = 0
    bulunan_hizmetler = []
    
    for hizmet in temel_hizmetler:
        tree = data_manager.poi_trees.get(hizmet)
        poi_gdf = data_manager.poi_data.get(hizmet)
        
        if tree and poi_gdf is not None and not poi_gdf.empty:
            # 2km içindeki hizmetleri bul
            indices = tree.query_ball_point(point_coords, r=2000)
            if indices:
                yakin_hizmet_sayisi += 1
                bulunan_hizmetler.append(hizmet)
                if yakin_hizmet_sayisi >= 1:  # En az 1 hizmet yeterli
                    break
    
    return yakin_hizmet_sayisi > 0, bulunan_hizmetler

def normalize_score_result(result, kategori):
    """Puanı 0-100 arası normalize eder ve kullanıcı dostu kategoriler ekler"""
    
    # Kategori bazında min/max değerleri (gerçek verilerden tahmin)
    score_ranges = {
        'eczane': {'min': -800, 'max': 900},
        'firin': {'min': -700, 'max': 800},
        'cafe': {'min': -600, 'max': 700},
        'market': {'min': -750, 'max': 850},
        'restoran': {'min': -650, 'max': 750}
    }
    
    if 'error' in result:
        return result
    
    raw_score = result.get('total_score', 0)
    
    # Min/max değerleri al
    min_score = score_ranges.get(kategori, {'min': -700, 'max': 800})['min']
    max_score = score_ranges.get(kategori, {'min': -700, 'max': 800})['max']
    
    # 0-100 arası normalize et
    normalized_score = ((raw_score - min_score) / (max_score - min_score)) * 100
    normalized_score = max(0, min(100, normalized_score))  # 0-100 arası sınırla
    
    # Kullanıcı dostu kategoriler
    if normalized_score >= 90:
        category = "Mükemmel"
        color = "#28a745"  # Yeşil
        emoji = "🟢"
    elif normalized_score >= 70:
        category = "Çok İyi"
        color = "#ffc107"  # Sarı
        emoji = "🟡"
    elif normalized_score >= 50:
        category = "İyi"
        color = "#fd7e14"  # Turuncu
        emoji = "🟠"
    elif normalized_score >= 30:
        category = "Orta"
        color = "#dc3545"  # Kırmızı
        emoji = "🔴"
    else:
        category = "Uygun Değil"
        color = "#6c757d"  # Gri
        emoji = "⚫"
    
    # Sonucu güncelle
    result['normalized_score'] = round(normalized_score, 1)
    result['raw_score'] = raw_score
    result['category'] = category
    result['color'] = color
    result['emoji'] = emoji
    result['total_score'] = round(normalized_score, 1)  # Ana skoru da normalize et
    
    return result

@app.route('/api/v5/score_point', methods=['POST'])
def score_point_api():
    data = request.get_json()
    lat = data.get('lat'); lon = data.get('lon'); kategori = data.get('kategori')
    if not all([lat, lon, kategori]):
        return jsonify({"error": "Eksik parametre"}), 400
    
    # Temel hizmet kontrolü
    has_services, found_services = check_basic_services(lat, lon)
    if not has_services:
        return jsonify({
            "error": "Bu bölge ticari faaliyet için uygun değil",
            "reason": "2km içinde temel hizmet bulunamadı",
            "required_services": "hastane, okul, market veya metro",
            "suggestion": "Daha merkezi bir lokasyon seçin"
        }), 400
    
    kurallar = Kural.query.filter_by(isletme_turu=kategori, aktif=True).all()
    result = score_single_point(lat, lon, kategori, kurallar)
    
    # Artık scorer.py'de zaten normalize ediliyor, ek işlem gerek yok
    return jsonify(result)

@app.route('/api/v5/get_locations/<kategori>')
def get_locations_api(kategori):
    # Debug bilgisi
    print(f"POI request for: {kategori}")
    print(f"Available POI keys: {list(data_manager.poi_data.keys())}")
    
    poi_gdf = data_manager.poi_data.get(kategori)
    print(f"POI data for {kategori}: {poi_gdf is not None}")
    if poi_gdf is not None:
        print(f"POI data size: {len(poi_gdf)}")
    
    if poi_gdf is None or poi_gdf.empty:
        return jsonify([])
    locations_df = pd.DataFrame(poi_gdf.drop(columns='geometry'))
    return jsonify(locations_df.to_dict(orient='records'))

@app.route('/api/v8/mahalle_analizi/<mahalle>/<kategori>')
def mahalle_analizi_api(mahalle, kategori):
    """Belirtilen mahallede en iyi lokasyonları bulur"""
    try:
        # Mahalle için aktif grid noktalarını al
        grid_points = Grid.query.filter_by(mahalle=mahalle, aktif=True).all()
        
        if not grid_points:
            return jsonify({"error": f"{mahalle} için aktif grid noktası bulunamadı"}), 404
        
        # Her grid noktası için skorlama yap
        kurallar = Kural.query.filter_by(isletme_turu=kategori, aktif=True).all()
        scored_locations = []
        
        for grid in grid_points:
            result = score_single_point(grid.lat, grid.lon, kategori, kurallar)
            if 'error' not in result:
                # Artık scorer.py'de zaten normalize ediliyor
                scored_locations.append({
                    'lat': grid.lat,
                    'lon': grid.lon,
                    'score': result['total_score'],
                    'category': result.get('category', 'Orta'),
                    'emoji': result.get('emoji', '🔴'),
                    'color': result.get('color', '#dc3545'),
                    'address': f"{mahalle} - Grid {grid.id}"
                })
        
        if not scored_locations:
            return jsonify({"error": f"{mahalle} için uygun lokasyon bulunamadı"}), 404
        
        # En yüksek skorlara göre sırala ve en iyi 10'unu al
        scored_locations.sort(key=lambda x: x['score'], reverse=True)
        top_locations = scored_locations[:10]
        
        # Analiz özeti
        avg_score = sum(loc['score'] for loc in scored_locations) / len(scored_locations)
        analiz_ozeti = f"{mahalle} için {len(scored_locations)} lokasyon analiz edildi. Ortalama skor: {avg_score:.1f}/100"
        
        return jsonify({
            'mahalle': mahalle,
            'kategori': kategori,
            'en_iyi_lokasyonlar': top_locations,
            'toplam_lokasyon': len(scored_locations),
            'ortalama_skor': round(avg_score, 1),
            'analiz_ozeti': analiz_ozeti
        })
        
    except Exception as e:
        return jsonify({"error": f"Mahalle analizi hatası: {str(e)}"}), 500

@app.route('/api/v8/heatmap_data/<kategori>')
def heatmap_data_api(kategori):
    """Belirtilen bölge için ısı haritası verisi döndürür"""
    try:
        # URL parametrelerini al
        north = float(request.args.get('north'))
        south = float(request.args.get('south'))
        east = float(request.args.get('east'))
        west = float(request.args.get('west'))
        
        # Bölge içindeki aktif grid noktalarını al
        grid_points = Grid.query.filter(
            Grid.lat.between(south, north),
            Grid.lon.between(west, east),
            Grid.aktif == True
        ).all()
        
        if not grid_points:
            return jsonify({
                "heatmap_data": [],
                "total_points": 0,
                "message": "Bu bölgede aktif grid noktası bulunamadı"
            })
        
        # Her grid noktası için skorlama yap
        kurallar = Kural.query.filter_by(isletme_turu=kategori, aktif=True).all()
        heatmap_data = []
        
        for grid in grid_points:
            result = score_single_point(grid.lat, grid.lon, kategori, kurallar)
            if 'error' not in result:
                # Artık scorer.py'de zaten normalize ediliyor
                # Isı haritası için [lat, lon, intensity] formatında veri
                intensity = result['total_score'] / 100.0  # 0-1 arası normalize et
                heatmap_data.append([grid.lat, grid.lon, intensity])
        
        return jsonify({
            'heatmap_data': heatmap_data,
            'total_points': len(heatmap_data),
            'bounds': {
                'north': north,
                'south': south,
                'east': east,
                'west': west
            }
        })
        
    except ValueError as e:
        return jsonify({"error": "Geçersiz koordinat parametreleri"}), 400
    except Exception as e:
        return jsonify({"error": f"Isı haritası verisi alınamadı: {str(e)}"}), 500

# --- V6 API Endpoints (Karşılaştırma Sistemi) ---
# --- Grid Validation Functions ---
def get_valid_grid_points():
    """Mahallesi bilinen aktif grid noktalarını döndürür"""
    return Grid.query.filter(
        Grid.mahalle.isnot(None), 
        Grid.mahalle != '', 
        Grid.aktif == True
    ).all()

def validate_grid_point(grid_point):
    """Grid noktasının geçerli olup olmadığını kontrol eder"""
    if not grid_point:
        return False, "Grid noktası bulunamadı"
    
    if not grid_point.mahalle:
        return False, "Grid noktasının mahalle bilgisi eksik"
    
    if not grid_point.aktif:
        return False, "Grid noktası aktif değil"
    
    return True, "Geçerli grid noktası"

def get_unique_comparison_pair(kategori, max_attempts=10):
    """Daha önce karşılaştırılmamış rastgele nokta çifti döndürür"""
    import random
    
    valid_grids = get_valid_grid_points()
    
    if len(valid_grids) < 2:
        return None, "Yeterli geçerli grid noktası bulunamadı"
    
    # Daha önce karşılaştırılmış çiftleri al
    existing_pairs = set()
    comparisons = Karsilastirma.query.filter_by(kategori=kategori).all()
    for comp in comparisons:
        # Her iki yönü de ekle (A-B ve B-A aynı)
        pair1 = (comp.nokta_a_lat, comp.nokta_a_lon, comp.nokta_b_lat, comp.nokta_b_lon)
        pair2 = (comp.nokta_b_lat, comp.nokta_b_lon, comp.nokta_a_lat, comp.nokta_a_lon)
        existing_pairs.add(pair1)
        existing_pairs.add(pair2)
    
    # Yeni çift bulmaya çalış
    for attempt in range(max_attempts):
        selected_points = random.sample(valid_grids, 2)
        nokta_a, nokta_b = selected_points[0], selected_points[1]
        
        # Bu çift daha önce karşılaştırıldı mı?
        current_pair = (nokta_a.lat, nokta_a.lon, nokta_b.lat, nokta_b.lon)
        if current_pair not in existing_pairs:
            return (nokta_a, nokta_b), "Başarılı"
    
    # Eğer yeni çift bulunamazsa, rastgele çift döndür
    selected_points = random.sample(valid_grids, 2)
    return (selected_points[0], selected_points[1]), "Rastgele çift (yeni çift bulunamadı)"

@app.route('/api/v6/get_comparison_pair/<kategori>')
def get_comparison_pair_api(kategori):
    """Rastgele iki grid noktası seçip skorlarıyla birlikte döndürür"""
    try:
        # Geçerli nokta çifti al
        result, message = get_unique_comparison_pair(kategori)
        
        if not result:
            return jsonify({"error": message}), 400
        
        nokta_a, nokta_b = result
        
        # Her nokta için skorlama yap
        kurallar = Kural.query.filter_by(isletme_turu=kategori, aktif=True).all()
        
        skor_a = score_single_point(nokta_a.lat, nokta_a.lon, kategori, kurallar)
        skor_b = score_single_point(nokta_b.lat, nokta_b.lon, kategori, kurallar)
        
        return jsonify({
            'nokta_A': {
                'id': nokta_a.id,
                'lat': nokta_a.lat,
                'lon': nokta_a.lon,
                'mahalle': nokta_a.mahalle,
                'total_score': skor_a['total_score'],
                'breakdown': skor_a['breakdown']
            },
            'nokta_B': {
                'id': nokta_b.id,
                'lat': nokta_b.lat,
                'lon': nokta_b.lon,
                'mahalle': nokta_b.mahalle,
                'total_score': skor_b['total_score'],
                'breakdown': skor_b['breakdown']
            },
            'message': message
        })
        
    except Exception as e:
        return jsonify({"error": f"Karşılaştırma çifti oluşturulamadı: {str(e)}"}), 500

@app.route('/api/v6/save_comparison', methods=['POST'])
def save_comparison_api():
    """Karşılaştırma sonucunu veritabanına kaydeder"""
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        required_fields = ['kategori', 'nokta_A_id', 'nokta_B_id', 'secim']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Eksik parametre: {field}"}), 400
        
        # Grid noktalarını getir
        nokta_a = Grid.query.get(data['nokta_A_id'])
        nokta_b = Grid.query.get(data['nokta_B_id'])
        
        if not nokta_a or not nokta_b:
            return jsonify({"error": "Grid noktaları bulunamadı"}), 404
        
        # Karşılaştırmayı kaydet
        karsilastirma = Karsilastirma(
            nokta_a_lat=nokta_a.lat,
            nokta_a_lon=nokta_a.lon,
            nokta_b_lat=nokta_b.lat,
            nokta_b_lon=nokta_b.lon,
            secim=data['secim'],
            kategori=data['kategori'],
            notlar=data.get('notlar', ''),
            nokta_a_skor=data.get('nokta_A_skor'),
            nokta_b_skor=data.get('nokta_B_skor')
        )
        
        db.session.add(karsilastirma)
        db.session.commit()
        
        # Otomatik optimizasyon kontrolü
        try:
            from optimizer import check_and_run_optimization
            optimization_result = check_and_run_optimization(db.session, data['kategori'])
            
            response_data = {
                "message": "Karşılaştırma başarıyla kaydedildi", 
                "id": karsilastirma.id
            }
            
            if optimization_result:
                response_data["optimization"] = optimization_result
                
            return jsonify(response_data)
            
        except Exception as opt_error:
            print(f"Optimizasyon kontrolü sırasında hata: {str(opt_error)}")
            return jsonify({"message": "Karşılaştırma başarıyla kaydedildi", "id": karsilastirma.id})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Karşılaştırma kaydedilemedi: {str(e)}"}), 500

@app.route('/api/v6/comparison_stats')
def comparison_stats_api():
    """Karşılaştırma istatistiklerini döndürür"""
    try:
        total_comparisons = Karsilastirma.query.count()
        
        # Kategoriye göre dağılım
        category_stats = db.session.query(
            Karsilastirma.kategori,
            db.func.count(Karsilastirma.id).label('count')
        ).group_by(Karsilastirma.kategori).all()
        
        # Son optimizasyon tarihi
        last_optimization = OptimizasyonLog.query.order_by(OptimizasyonLog.tarih.desc()).first()
        
        return jsonify({
            'total_comparisons': total_comparisons,
            'category_breakdown': [{'kategori': cat, 'count': count} for cat, count in category_stats],
            'last_optimization': last_optimization.tarih.isoformat() if last_optimization else None,
            'optimization_threshold': 100,
            'ready_for_optimization': total_comparisons >= 100
        })
        
    except Exception as e:
        return jsonify({"error": f"İstatistikler alınamadı: {str(e)}"}), 500

@app.route('/api/v6/optimization_history')
def optimization_history_api():
    """Optimizasyon geçmişini döndürür"""
    try:
        history = OptimizasyonLog.query.order_by(OptimizasyonLog.tarih.desc()).limit(20).all()
        
        history_data = []
        for log in history:
            history_data.append({
                'id': log.id,
                'tarih': log.tarih.isoformat(),
                'kategori': log.kategori,
                'karsilastirma_sayisi': log.karsilastirma_sayisi,
                'degisiklik_detayi': log.degisiklik_detayi,
                'basari_durumu': log.basari_durumu
            })
        
        return jsonify({
            'history': history_data,
            'total_optimizations': len(history_data)
        })
        
    except Exception as e:
        return jsonify({"error": f"Optimizasyon geçmişi alınamadı: {str(e)}"}), 500

@app.route('/api/v6/trigger_optimization/<kategori>', methods=['POST'])
def trigger_optimization_api(kategori):
    """Manuel optimizasyon tetikler"""
    try:
        from optimizer import ComparisonAnalyzer
        
        analyzer = ComparisonAnalyzer(db.session)
        result = analyzer.run_optimization(kategori)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Optimizasyon tetiklenemedi: {str(e)}"}), 500

# --- 5. Grid Yükleme Fonksiyonu ---
def load_grid_points():
    """Grid noktalarını GeoJSON'dan yükleyip mahalle bilgilerini ekler"""
    import geopandas as gpd
    from shapely.geometry import Point
    
    print("Grid noktaları yükleniyor...")
    
    try:
        # Grid noktalarını yükle
        grid_gdf = gpd.read_file("yenimahalle_grid.geojson")
        print(f"GeoJSON'dan {len(grid_gdf)} grid noktası okundu")
        
        # Mahalle poligonlarını data_manager'dan al
        neighborhood_polygons = data_manager.neighborhood_polygons
        print(f"Mahalle poligonları hazır: {len(neighborhood_polygons)} mahalle")
        
        # Her grid noktası için mahalle bilgisini bul
        grid_points_to_add = []
        valid_count = 0
        
        for idx, row in grid_gdf.iterrows():
            lat = row.geometry.y
            lon = row.geometry.x
            
            # Nokta için mahalle bilgisini bul
            point_gdf = gpd.GeoDataFrame(geometry=[Point(lon, lat)], crs="EPSG:4326")
            mahalle_bilgisi = gpd.sjoin(point_gdf, neighborhood_polygons, how='left', predicate='within')
            
            mahalle = None
            if not mahalle_bilgisi.empty and pd.notna(mahalle_bilgisi['mahalle_x'].iloc[0]):
                mahalle = mahalle_bilgisi['mahalle_x'].iloc[0]
                valid_count += 1
            
            grid_points_to_add.append(Grid(lat=lat, lon=lon, mahalle=mahalle, aktif=(mahalle is not None)))
            
            # İlerleme göstergesi
            if (idx + 1) % 100 == 0:
                print(f"İşlenen nokta sayısı: {idx + 1}/{len(grid_gdf)}")
        
        # Toplu olarak veritabanına ekle
        db.session.bulk_save_objects(grid_points_to_add)
        db.session.commit()
        
        print(f"Grid noktaları başarıyla yüklendi:")
        print(f"  - Toplam nokta: {len(grid_points_to_add)}")
        print(f"  - Mahallesi olan nokta: {valid_count}")
        print(f"  - Mahallesi olmayan nokta: {len(grid_points_to_add) - valid_count}")
        
        return len(grid_points_to_add), valid_count
        
    except Exception as e:
        print(f"Grid noktaları yüklenirken hata oluştu: {str(e)}")
        db.session.rollback()
        return 0, 0

# --- Modern Admin Panel API Endpoints ---

def init_default_configs():
    """Varsayılan konfigürasyonları yükle"""
    categories = ['eczane', 'cafe', 'restoran', 'market', 'firin']
    
    for category in categories:
        # Weight config kontrolü
        if not WeightConfig.query.filter_by(category=category).first():
            weight_config = WeightConfig(
                category=category,
                hospital_weight=0.30,
                competitor_weight=0.30,
                demographics_weight=0.10,
                important_places_weight=0.30
            )
            db.session.add(weight_config)
    
    db.session.commit()

@app.route('/api/admin/weights/<category>', methods=['GET'])
def get_weights(category):
    """Get current weight configuration for category"""
    try:
        config = WeightConfig.query.filter_by(category=category).first()
        if not config:
            # Create default config
            config = WeightConfig(category=category)
            db.session.add(config)
            db.session.commit()
        
        return jsonify({
            'category': config.category,
            'hospital_weight': config.hospital_weight,
            'competitor_weight': config.competitor_weight,
            'demographics_weight': config.demographics_weight,
            'important_places_weight': config.important_places_weight,
            'updated_at': config.updated_at.isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/weights/<category>', methods=['POST'])
def update_weights(category):
    """Update weight configuration for category"""
    try:
        data = request.get_json()
        
        # Validate weights sum to 1.0
        total = (data.get('hospital_weight', 0) + 
                data.get('competitor_weight', 0) + 
                data.get('demographics_weight', 0) + 
                data.get('important_places_weight', 0))
        
        if abs(total - 1.0) > 0.01:  # Allow small floating point errors
            return jsonify({"error": "Ağırlıklar toplamı %100 olmalıdır"}), 400
        
        config = WeightConfig.query.filter_by(category=category).first()
        if not config:
            config = WeightConfig(category=category)
            db.session.add(config)
        
        config.hospital_weight = data.get('hospital_weight', config.hospital_weight)
        config.competitor_weight = data.get('competitor_weight', config.competitor_weight)
        config.demographics_weight = data.get('demographics_weight', config.demographics_weight)
        config.important_places_weight = data.get('important_places_weight', config.important_places_weight)
        config.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Ağırlıklar başarıyla güncellendi",
            "category": category,
            "weights": {
                'hospital_weight': config.hospital_weight,
                'competitor_weight': config.competitor_weight,
                'demographics_weight': config.demographics_weight,
                'important_places_weight': config.important_places_weight
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/weights/<category>/reset', methods=['POST'])
def reset_weights(category):
    """Reset weights to default values"""
    try:
        config = WeightConfig.query.filter_by(category=category).first()
        if not config:
            config = WeightConfig(category=category)
            db.session.add(config)
        
        # Reset to defaults
        config.hospital_weight = 0.30
        config.competitor_weight = 0.30
        config.demographics_weight = 0.10
        config.important_places_weight = 0.30
        config.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Ağırlıklar varsayılan değerlere sıfırlandı",
            "category": category
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/parameters/<category>', methods=['GET'])
def get_parameters(category):
    """Get all parameters for category"""
    try:
        # Get parameters from existing Kural table
        kurallar = Kural.query.filter_by(isletme_turu=category, aktif=True).all()
        
        parameters = {}
        for kural in kurallar:
            param_key = kural.parametre
            parameters[param_key] = {
                'max_score': kural.max_puan,
                'effect_distance': kural.etki_mesafesi,
                'log_coefficient': kural.log_katsayisi,
                'is_active': kural.aktif
            }
        
        return jsonify({
            'category': category,
            'parameters': parameters
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/parameters/<category>/<parameter>', methods=['POST'])
def update_parameter(category, parameter):
    """Update specific parameter configuration"""
    try:
        data = request.get_json()
        
        # Find existing rule or create new one
        kural = Kural.query.filter_by(
            isletme_turu=category, 
            parametre=parameter
        ).first()
        
        if not kural:
            kural = Kural(isletme_turu=category, parametre=parameter)
            db.session.add(kural)
        
        # Update values
        if 'max_score' in data:
            kural.max_puan = float(data['max_score'])
        if 'effect_distance' in data:
            kural.etki_mesafesi = int(data['effect_distance'])
        if 'log_coefficient' in data:
            kural.log_katsayisi = float(data['log_coefficient'])
        if 'is_active' in data:
            kural.aktif = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            "message": f"{parameter} parametresi başarıyla güncellendi",
            "category": category,
            "parameter": parameter,
            "values": {
                'max_score': kural.max_puan,
                'effect_distance': kural.etki_mesafesi,
                'log_coefficient': kural.log_katsayisi,
                'is_active': kural.aktif
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/preview/<category>', methods=['POST'])
def preview_score(category):
    """Get real-time score preview with current settings"""
    try:
        data = request.get_json()
        
        # Sample location (Kızılay)
        lat = 39.9334
        lon = 32.8597
        
        # Get current rules
        kurallar = Kural.query.filter_by(isletme_turu=category, aktif=True).all()
        
        # Calculate score with current settings
        from scorer import score_single_point
        result = score_single_point(lat, lon, category, kurallar)
        
        if 'error' in result:
            return jsonify({"error": result['error']}), 400
        
        return jsonify({
            'location': {'lat': lat, 'lon': lon},
            'category': category,
            'total_score': result['total_score'],
            'breakdown': result['breakdown']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Advanced Admin API Endpoints ---

# Parameter Management APIs
@app.route('/api/admin/parameters/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    try:
        categories = [
            {'id': 'eczane', 'name': 'Eczane', 'emoji': '💊'},
            {'id': 'cafe', 'name': 'Cafe', 'emoji': '☕'},
            {'id': 'restoran', 'name': 'Restoran', 'emoji': '🍽️'},
            {'id': 'market', 'name': 'Market', 'emoji': '🛒'},
            {'id': 'firin', 'name': 'Fırın', 'emoji': '🍞'}
        ]
        return jsonify(categories)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/parameters/<category>/list', methods=['GET'])
def get_category_parameters(category):
    """Get all parameters for a specific category"""
    try:
        parameters = AdvancedParameter.query.filter_by(
            category=category, 
            is_active=True
        ).all()
        
        return jsonify([param.to_dict() for param in parameters])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/parameters/<category>/update', methods=['PUT'])
def update_category_parameters(category):
    """Update multiple parameters for a category"""
    try:
        data = request.get_json()
        parameters_data = data.get('parameters', [])
        
        updated_count = 0
        for param_data in parameters_data:
            param_id = param_data.get('id')
            if not param_id:
                continue
                
            param = AdvancedParameter.query.get(param_id)
            if not param:
                continue
            
            # Save history before updating
            old_value = {
                'max_score': param.max_score,
                'effect_distance': param.effect_distance,
                'log_coefficient': param.log_coefficient,
                'categorical_values': param.categorical_values
            }
            
            # Update parameter
            param.max_score = param_data.get('max_score', param.max_score)
            param.effect_distance = param_data.get('effect_distance', param.effect_distance)
            param.log_coefficient = param_data.get('log_coefficient', param.log_coefficient)
            param.categorical_values = param_data.get('categorical_values', param.categorical_values)
            param.updated_at = datetime.utcnow()
            
            # Save history
            new_value = {
                'max_score': param.max_score,
                'effect_distance': param.effect_distance,
                'log_coefficient': param.log_coefficient,
                'categorical_values': param.categorical_values
            }
            
            history = ParameterHistory(
                parameter_id=param.id,
                old_value=old_value,
                new_value=new_value,
                changed_by=data.get('changed_by', 'admin'),
                change_reason=data.get('change_reason', 'Manual update via advanced admin panel')
            )
            db.session.add(history)
            updated_count += 1
        
        db.session.commit()
        return jsonify({
            'success': True,
            'updated_count': updated_count,
            'message': f'{updated_count} parameters updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/parameters/<category>/create', methods=['POST'])
def create_parameter(category):
    """Create a new parameter for a category"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['parameter_name', 'parameter_type', 'max_score']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create new parameter
        param = AdvancedParameter(
            category=category,
            parameter_name=data['parameter_name'],
            parameter_type=data['parameter_type'],
            max_score=data['max_score'],
            effect_distance=data.get('effect_distance'),
            log_coefficient=data.get('log_coefficient'),
            categorical_values=data.get('categorical_values'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(param)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'parameter': param.to_dict(),
            'message': 'Parameter created successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/parameters/<category>/<int:param_id>', methods=['DELETE'])
def delete_parameter(category, param_id):
    """Delete a parameter"""
    try:
        param = AdvancedParameter.query.get(param_id)
        if not param:
            return jsonify({"error": "Parameter not found"}), 404
        
        if param.category != category:
            return jsonify({"error": "Parameter category mismatch"}), 400
        
        # Save deletion history
        history = ParameterHistory(
            parameter_id=param.id,
            old_value=param.to_dict(),
            new_value={'deleted': True},
            changed_by='admin',
            change_reason='Parameter deleted via advanced admin panel'
        )
        db.session.add(history)
        
        # Soft delete (mark as inactive)
        param.is_active = False
        param.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Parameter deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Testing APIs
@app.route('/api/admin/testing/test-points', methods=['GET'])
def get_test_points():
    """Get all test points"""
    try:
        test_points = TestPoint.query.all()
        return jsonify([point.to_dict() for point in test_points])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/testing/test-points', methods=['POST'])
def create_test_point():
    """Create a new test point"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'lat', 'lon', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create test point
        test_point = TestPoint(
            name=data['name'],
            description=data.get('description'),
            lat=data['lat'],
            lon=data['lon'],
            category=data['category'],
            expected_score=data.get('expected_score'),
            is_predefined=data.get('is_predefined', False),
            created_by=data.get('created_by', 'admin')
        )
        
        db.session.add(test_point)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'test_point': test_point.to_dict(),
            'message': 'Test point created successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/testing/test-points/<int:point_id>', methods=['PUT'])
def update_test_point(point_id):
    """Update a test point"""
    try:
        test_point = TestPoint.query.get(point_id)
        if not test_point:
            return jsonify({"error": "Test point not found"}), 404
        
        data = request.get_json()
        
        # Update fields
        test_point.name = data.get('name', test_point.name)
        test_point.description = data.get('description', test_point.description)
        test_point.lat = data.get('lat', test_point.lat)
        test_point.lon = data.get('lon', test_point.lon)
        test_point.category = data.get('category', test_point.category)
        test_point.expected_score = data.get('expected_score', test_point.expected_score)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'test_point': test_point.to_dict(),
            'message': 'Test point updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/testing/test-points/<int:point_id>', methods=['DELETE'])
def delete_test_point(point_id):
    """Delete a test point"""
    try:
        test_point = TestPoint.query.get(point_id)
        if not test_point:
            return jsonify({"error": "Test point not found"}), 404
        
        # Don't allow deletion of predefined points
        if test_point.is_predefined:
            return jsonify({"error": "Cannot delete predefined test points"}), 400
        
        db.session.delete(test_point)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Test point deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/testing/score-point', methods=['POST'])
def admin_score_point():
    """Score a point with current parameters (optimized for admin panel)"""
    try:
        data = request.get_json()
        lat = data.get('lat')
        lon = data.get('lon')
        category = data.get('category')
        
        if not all([lat, lon, category]):
            return jsonify({"error": "Missing required parameters: lat, lon, category"}), 400
        
        # Get current parameters from AdvancedParameter model
        parameters = AdvancedParameter.query.filter_by(
            category=category,
            is_active=True
        ).all()
        
        if not parameters:
            return jsonify({"error": f"No active parameters found for category: {category}"}), 404
        
        # Convert AdvancedParameter to legacy Kural format for scorer
        legacy_rules = []
        for param in parameters:
            rule = Kural(
                isletme_turu=category,
                parametre=param.parameter_name,
                max_puan=param.max_score,
                etki_mesafesi=param.effect_distance or 0,
                log_katsayisi=param.log_coefficient or 1.0,
                deger=None,  # Will be handled by categorical_values
                aktif=True
            )
            
            # Handle categorical values
            if param.categorical_values:
                for value, score in param.categorical_values.items():
                    cat_rule = Kural(
                        isletme_turu=category,
                        parametre=param.parameter_name,
                        max_puan=score,
                        etki_mesafesi=0,
                        log_katsayisi=1.0,
                        deger=value,
                        aktif=True
                    )
                    legacy_rules.append(cat_rule)
            else:
                legacy_rules.append(rule)
        
        # Score the point
        import time
        start_time = time.time()
        result = score_single_point(lat, lon, category, legacy_rules)
        scoring_time = time.time() - start_time
        
        if 'error' in result:
            return jsonify({"error": result['error']}), 400
        
        # Add performance metrics
        result['performance'] = {
            'scoring_time_ms': round(scoring_time * 1000, 2),
            'parameters_used': len(legacy_rules),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin/modern')
def modern_admin_panel():
    """Modern admin panel sayfası"""
    return render_template('admin/modern_panel.html')

# History APIs
@app.route('/api/admin/history/parameter-history', methods=['GET'])
def get_parameter_history():
    """Get parameter change history"""
    try:
        # Get query parameters
        category = request.args.get('category')
        limit = int(request.args.get('limit', 50))
        
        query = ParameterHistory.query
        
        if category:
            # Join with AdvancedParameter to filter by category
            query = query.join(AdvancedParameter).filter(AdvancedParameter.category == category)
        
        history = query.order_by(ParameterHistory.created_at.desc()).limit(limit).all()
        
        history_data = []
        for record in history:
            history_data.append({
                'id': record.id,
                'parameter_id': record.parameter_id,
                'parameter_name': record.parameter.parameter_name if record.parameter else 'Unknown',
                'category': record.parameter.category if record.parameter else 'Unknown',
                'old_value': record.old_value,
                'new_value': record.new_value,
                'changed_by': record.changed_by,
                'change_reason': record.change_reason,
                'created_at': record.created_at.isoformat()
            })
        
        return jsonify({
            'history': history_data,
            'total_records': len(history_data)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/history/revert-changes', methods=['POST'])
def revert_parameter_changes():
    """Revert parameter changes to a previous state"""
    try:
        data = request.get_json()
        history_id = data.get('history_id')
        
        if not history_id:
            return jsonify({"error": "Missing history_id"}), 400
        
        # Get the history record
        history = ParameterHistory.query.get(history_id)
        if not history:
            return jsonify({"error": "History record not found"}), 404
        
        # Get the parameter
        param = AdvancedParameter.query.get(history.parameter_id)
        if not param:
            return jsonify({"error": "Parameter not found"}), 404
        
        # Save current state as new history before reverting
        current_state = {
            'max_score': param.max_score,
            'effect_distance': param.effect_distance,
            'log_coefficient': param.log_coefficient,
            'categorical_values': param.categorical_values
        }
        
        revert_history = ParameterHistory(
            parameter_id=param.id,
            old_value=current_state,
            new_value=history.old_value,
            changed_by=data.get('changed_by', 'admin'),
            change_reason=f'Reverted to state from {history.created_at.strftime("%Y-%m-%d %H:%M")}'
        )
        db.session.add(revert_history)
        
        # Revert the parameter to old values
        old_values = history.old_value
        param.max_score = old_values.get('max_score', param.max_score)
        param.effect_distance = old_values.get('effect_distance', param.effect_distance)
        param.log_coefficient = old_values.get('log_coefficient', param.log_coefficient)
        param.categorical_values = old_values.get('categorical_values', param.categorical_values)
        param.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Parameter successfully reverted',
            'parameter': param.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/history/snapshots', methods=['GET'])
def get_parameter_snapshots():
    """Get parameter snapshots for different time periods"""
    try:
        category = request.args.get('category')
        
        if not category:
            return jsonify({"error": "Category parameter is required"}), 400
        
        # Get current parameters
        current_params = AdvancedParameter.query.filter_by(
            category=category,
            is_active=True
        ).all()
        
        # Get snapshots from different time periods
        from datetime import timedelta
        now = datetime.utcnow()
        
        snapshots = {
            'current': {
                'timestamp': now.isoformat(),
                'parameters': [param.to_dict() for param in current_params]
            },
            'snapshots': []
        }
        
        # Get historical snapshots (last 10 significant changes)
        significant_changes = ParameterHistory.query.join(AdvancedParameter).filter(
            AdvancedParameter.category == category
        ).order_by(ParameterHistory.created_at.desc()).limit(10).all()
        
        for change in significant_changes:
            snapshots['snapshots'].append({
                'id': change.id,
                'timestamp': change.created_at.isoformat(),
                'changed_by': change.changed_by,
                'change_reason': change.change_reason,
                'parameter_name': change.parameter.parameter_name if change.parameter else 'Unknown',
                'old_value': change.old_value,
                'new_value': change.new_value
            })
        
        return jsonify(snapshots)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Export/Import APIs
@app.route('/api/admin/export/export-parameters', methods=['GET'])
def export_parameters():
    """Export all parameters as JSON"""
    try:
        category = request.args.get('category')
        
        query = AdvancedParameter.query.filter_by(is_active=True)
        if category:
            query = query.filter_by(category=category)
        
        parameters = query.all()
        
        export_data = {
            'export_info': {
                'timestamp': datetime.utcnow().isoformat(),
                'category': category or 'all',
                'total_parameters': len(parameters),
                'exported_by': 'admin'
            },
            'parameters': [param.to_dict() for param in parameters]
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/export/import-parameters', methods=['POST'])
def import_parameters():
    """Import parameters from JSON"""
    try:
        data = request.get_json()
        
        if 'parameters' not in data:
            return jsonify({"error": "Invalid import format: missing 'parameters' key"}), 400
        
        parameters_data = data['parameters']
        imported_count = 0
        updated_count = 0
        errors = []
        
        for param_data in parameters_data:
            try:
                # Validate required fields
                required_fields = ['category', 'parameter_name', 'parameter_type', 'max_score']
                for field in required_fields:
                    if field not in param_data:
                        errors.append(f"Missing required field '{field}' in parameter: {param_data.get('parameter_name', 'Unknown')}")
                        continue
                
                # Check if parameter already exists
                existing_param = AdvancedParameter.query.filter_by(
                    category=param_data['category'],
                    parameter_name=param_data['parameter_name']
                ).first()
                
                if existing_param:
                    # Update existing parameter
                    old_value = existing_param.to_dict()
                    
                    existing_param.parameter_type = param_data['parameter_type']
                    existing_param.max_score = param_data['max_score']
                    existing_param.effect_distance = param_data.get('effect_distance')
                    existing_param.log_coefficient = param_data.get('log_coefficient')
                    existing_param.categorical_values = param_data.get('categorical_values')
                    existing_param.updated_at = datetime.utcnow()
                    
                    # Save history
                    history = ParameterHistory(
                        parameter_id=existing_param.id,
                        old_value=old_value,
                        new_value=param_data,
                        changed_by='admin',
                        change_reason='Parameter imported from JSON'
                    )
                    db.session.add(history)
                    updated_count += 1
                    
                else:
                    # Create new parameter
                    new_param = AdvancedParameter(
                        category=param_data['category'],
                        parameter_name=param_data['parameter_name'],
                        parameter_type=param_data['parameter_type'],
                        max_score=param_data['max_score'],
                        effect_distance=param_data.get('effect_distance'),
                        log_coefficient=param_data.get('log_coefficient'),
                        categorical_values=param_data.get('categorical_values'),
                        is_active=param_data.get('is_active', True)
                    )
                    db.session.add(new_param)
                    imported_count += 1
                    
            except Exception as param_error:
                errors.append(f"Error processing parameter {param_data.get('parameter_name', 'Unknown')}: {str(param_error)}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'imported_count': imported_count,
            'updated_count': updated_count,
            'total_processed': imported_count + updated_count,
            'errors': errors,
            'message': f'Import completed: {imported_count} new, {updated_count} updated'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/admin/test')
def admin_test_interface():
    """Vue.js test page"""
    return render_template('admin/test.html')

@app.route('/test-progress-bars')
def test_progress_bars():
    """Progress bars test page"""
    return render_template('test_progress_bars.html')

@app.route('/simple-progress-test')
def simple_progress_test():
    """Simple progress bars test page"""
    return render_template('simple_progress_test.html')

@app.route('/admin/advanced')
def advanced_admin_panel():
    """Advanced scoring control panel"""
    import time
    return render_template('admin/advanced.html', timestamp=int(time.time()))

# --- Migration Functions ---
def migrate_kural_to_advanced_parameter():
    """Migrate existing Kural data to AdvancedParameter model"""
    try:
        print("🔄 Migrating Kural data to AdvancedParameter...")
        
        # Check if migration already done
        existing_count = AdvancedParameter.query.count()
        if existing_count > 0:
            print(f"✅ Migration already completed. {existing_count} AdvancedParameter records found.")
            return
        
        # Get all active Kural records
        kurallar = Kural.query.filter_by(aktif=True).all()
        print(f"📊 Found {len(kurallar)} active Kural records to migrate")
        
        migrated_count = 0
        for kural in kurallar:
            # Determine parameter type
            if kural.etki_mesafesi and kural.etki_mesafesi > 0:
                param_type = 'distance'
            elif kural.deger:
                param_type = 'demographic'
            else:
                param_type = 'other'
            
            # Create AdvancedParameter
            advanced_param = AdvancedParameter(
                category=kural.isletme_turu,
                parameter_name=kural.parametre,
                parameter_type=param_type,
                max_score=kural.max_puan or 0,
                effect_distance=kural.etki_mesafesi if kural.etki_mesafesi and kural.etki_mesafesi > 0 else None,
                log_coefficient=kural.log_katsayisi if kural.log_katsayisi else None,
                categorical_values={kural.deger: kural.max_puan} if kural.deger else None,
                is_active=True
            )
            
            db.session.add(advanced_param)
            migrated_count += 1
        
        db.session.commit()
        print(f"✅ Successfully migrated {migrated_count} records to AdvancedParameter")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.session.rollback()

def initialize_predefined_test_points():
    """Initialize predefined test points"""
    try:
        print("🔄 Initializing predefined test points...")
        
        # Check if already initialized
        existing_count = TestPoint.query.filter_by(is_predefined=True).count()
        if existing_count > 0:
            print(f"✅ Predefined test points already exist. {existing_count} found.")
            return
        
        # Predefined test points
        test_points = [
            {
                'name': 'Kötü Lokasyon #1',
                'description': 'İki bitişik eczanenin tam ortası - Bilge Şen ve Birinci Eczanesi arasında',
                'lat': 39.969169,
                'lon': 32.783675,
                'category': 'eczane',
                'expected_score': 30,
                'is_predefined': True,
                'created_by': 'system'
            },
            {
                'name': 'İyi Lokasyon #1',
                'description': 'Hastane yakını, rakip az olan bölge',
                'lat': 39.975000,
                'lon': 32.790000,
                'category': 'eczane',
                'expected_score': 85,
                'is_predefined': True,
                'created_by': 'system'
            }
        ]
        
        for point_data in test_points:
            test_point = TestPoint(**point_data)
            db.session.add(test_point)
        
        db.session.commit()
        print(f"✅ Successfully created {len(test_points)} predefined test points")
        
    except Exception as e:
        print(f"❌ Test point initialization failed: {str(e)}")
        db.session.rollback()

# --- 6. Uygulama Başlatma ---
if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Initialize default configurations
            init_default_configs()
            
            # Run migrations
            migrate_kural_to_advanced_parameter()
            initialize_predefined_test_points()
            
        except Exception as e:
            print(f"⚠️ Database initialization warning: {e}")
            print("🔄 Continuing with existing database...")
        
        # Kuralları yükle
        try:
            if not Kural.query.first():
                print("Veritabanı boş, optimize edilmiş varsayılan kurallar ekleniyor...")
            
            # --- DEĞİŞİKLİK BURADA: Tüm optimize edilmiş kuralları ekliyoruz ---
            varsayilan_kurallar = [
                # --- ECZANE KURALLARI ---
                Kural(isletme_turu='eczane', parametre='hastane', max_puan=100, etki_mesafesi=1000, log_katsayisi=2.0),
                Kural(isletme_turu='eczane', parametre='rakip_eczane', max_puan=-100, etki_mesafesi=700, log_katsayisi=3.0),
                Kural(isletme_turu='eczane', parametre='metro', max_puan=50, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='eczane', parametre='avm', max_puan=40, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='eczane', parametre='universite', max_puan=30, etki_mesafesi=1000, log_katsayisi=1.5),
                Kural(isletme_turu='eczane', parametre='yas_profili', deger='Yaşlı Ağırlıklı / Karma', max_puan=30),
                Kural(isletme_turu='eczane', parametre='yas_profili', deger='Yaşlı-Karma', max_puan=25),
                Kural(isletme_turu='eczane', parametre='yas_profili', deger='Genç Ağırlıklı / Orta Yaş Ağırlıklı', max_puan=-20),
                
                # --- CAFE KURALLARI ---
                Kural(isletme_turu='cafe', parametre='hastane', max_puan=50, etki_mesafesi=1000, log_katsayisi=2.0),
                Kural(isletme_turu='cafe', parametre='rakip_cafe', max_puan=-80, etki_mesafesi=500, log_katsayisi=3.0),
                Kural(isletme_turu='cafe', parametre='metro', max_puan=70, etki_mesafesi=600, log_katsayisi=2.0),
                Kural(isletme_turu='cafe', parametre='avm', max_puan=60, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='cafe', parametre='universite', max_puan=80, etki_mesafesi=1000, log_katsayisi=1.5),
                
                # --- RESTORAN KURALLARI ---
                Kural(isletme_turu='restoran', parametre='hastane', max_puan=40, etki_mesafesi=1000, log_katsayisi=2.0),
                Kural(isletme_turu='restoran', parametre='rakip_restoran', max_puan=-90, etki_mesafesi=600, log_katsayisi=3.0),
                Kural(isletme_turu='restoran', parametre='metro', max_puan=80, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='restoran', parametre='avm', max_puan=70, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='restoran', parametre='universite', max_puan=60, etki_mesafesi=1000, log_katsayisi=1.5),
                
                # --- MARKET KURALLARI ---
                Kural(isletme_turu='market', parametre='hastane', max_puan=60, etki_mesafesi=1000, log_katsayisi=2.0),
                Kural(isletme_turu='market', parametre='rakip_market', max_puan=-120, etki_mesafesi=800, log_katsayisi=3.0),
                Kural(isletme_turu='market', parametre='metro', max_puan=60, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='market', parametre='avm', max_puan=30, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='market', parametre='universite', max_puan=40, etki_mesafesi=1000, log_katsayisi=1.5),
                
                # --- FIRIN KURALLARI ---
                Kural(isletme_turu='firin', parametre='hastane', max_puan=50, etki_mesafesi=1000, log_katsayisi=2.0),
                Kural(isletme_turu='firin', parametre='rakip_firin', max_puan=-100, etki_mesafesi=600, log_katsayisi=3.0),
                Kural(isletme_turu='firin', parametre='metro', max_puan=40, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='firin', parametre='avm', max_puan=50, etki_mesafesi=800, log_katsayisi=2.0),
                Kural(isletme_turu='firin', parametre='universite', max_puan=30, etki_mesafesi=1000, log_katsayisi=1.5),
                Kural(isletme_turu='eczane', parametre='gelir_duzeyi', deger='Orta / Orta-Yüksek', max_puan=10),
                Kural(isletme_turu='eczane', parametre='nufus_yogunlugu', max_puan=5),

                # --- FIRIN KURALLARI ---
                Kural(isletme_turu='firin', parametre='rakip_firin', max_puan=-150, etki_mesafesi=500, log_katsayisi=3.5),
                Kural(isletme_turu='firin', parametre='nufus_yogunlugu', max_puan=20),
                Kural(isletme_turu='firin', parametre='metro', max_puan=20, etki_mesafesi=600, log_katsayisi=2.5),
                Kural(isletme_turu='firin', parametre='gelir_duzeyi', deger='Orta-Düşük / Orta', max_puan=15),
                Kural(isletme_turu='firin', parametre='hastane', max_puan=5, etki_mesafesi=1000, log_katsayisi=1.0),
                Kural(isletme_turu='firin', parametre='avm', max_puan=-20, etki_mesafesi=1000, log_katsayisi=1.5),
                Kural(isletme_turu='firin', parametre='universite', max_puan=10, etki_mesafesi=1000, log_katsayisi=1.5),

                # Diğer kategoriler için de benzer şekilde eklenebilir...
            ]
            db.session.bulk_save_objects(varsayilan_kurallar)
            db.session.commit()
            print("Varsayılan kurallar başarıyla eklendi.")
        
            # Grid noktalarını yükle
            if not Grid.query.first():
                load_grid_points()
        except Exception as e:
            print(f"⚠️ Database operations warning: {e}")
            print("🔄 Starting server without database initialization...")

    app.run(debug=True, use_reloader=False)
