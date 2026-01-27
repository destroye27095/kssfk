# PHASE 4 QUICK REFERENCE
## Scoring Formulas, Algorithms & Data Points

---

## ⭐ COMPOSITE SCORING FORMULA

```
OVERALL_SCORE = (
    fee_affordability_score × 0.25 +      // 25%
    environment_quality_score × 0.15 +    // 15%
    security_level_score × 0.15 +         // 15%
    teacher_quality_score × 0.20 +        // 20%
    curriculum_offerings_score × 0.15 +   // 15%
    accessibility_score × 0.10             // 10%
)
```

**STAR RATING CONVERSION**:
```
85-100  →  5.0 ★★★★★  (Excellent)
70-84   →  4.5 ★★★★☆  (Good)
60-69   →  4.0 ★★★★   (Above Average)
50-59   →  3.5 ★★★☆   (Average)
40-49   →  3.0 ★★★    (Below Average)
25-39   →  2.5 ★★☆    (Poor)
15-24   →  2.0 ★★     (Very Poor)
<15     →  1.0 ★      (Failing)
```

---

## 1️⃣ FEE AFFORDABILITY (0-100 points, weight: 25%)

**Assumption**: Typical Kenyan household income = 180,000 KES/year (15,000/month)

```
FREE or ASAL          →  100 points  ✓ BEST OPTION
<5% of income         →   95 points  (9,000 KES/year)
5-10% of income       →   80 points  (15,000 KES/year)
10-15% of income      →   65 points  (27,000 KES/year)
15-25% of income      →   45 points  (45,000 KES/year)
>25% of income        →   20 points  (>45,000 KES/year)
```

**KEY RULE**: ASAL zones automatically get FREE fees (no exceptions)

---

## 2️⃣ ENVIRONMENT QUALITY (0-100 points, weight: 15%)

**Components**:

### Zone Type Bonus (±15 points)
```
ASAL                  →  +15  (Peaceful, few vehicles)
RURAL                 →  +20  (Very peaceful)
URBAN                 →  -15  (Traffic, noise)
```

### Compound Size (0-15 points)
```
≥5 acres              →  +15
2-5 acres             →  +10
1-2 acres             →   +5
<1 acre               →    0  (Overcrowded)
```

### Green Space (±5-10 points)
```
Has green space       →  +10
No green space        →   -5
```

### Noise Level (±0 to -20 points)
```
LOW (far from roads)  →  +15
MODERATE              →    0
HIGH (near traffic)   →  -20
```

### Congestion (±0 to -15 points)
```
LOW (<250/acre)       →  +10
MODERATE (250-500)    →    0
HIGH (>500/acre)      →  -15
```

**FORMULA**:
```
score = 50                              // Base
score += zone_bonus                     // ±15
score += compound_size_score            // 0-15
score += (has_green_space ? 10 : -5)    // ±5-10
score += noise_score                    // ±0-20
score += congestion_score               // ±0-15
score = clamp(score, 0, 100)
```

**ENVIRONMENT TYPE**:
```
score ≥ 75            →  CALM       (Peaceful)
50 ≤ score < 75       →  MODERATE   (Mixed)
score < 50            →  BUSY       (High traffic/congestion)
```

---

## 3️⃣ SECURITY LEVEL (0-100 points, weight: 15%)

**Base Score**: 50 points

### Risk Zone Classification (±15 points)
```
HIGH-RISK (Nairobi, Mombasa, Kisumu, Nakuru)     →  -15
MEDIUM-RISK (8 other counties)                   →   -5
LOW-RISK (rest of Kenya)                         →   +5
```

### Infrastructure Scoring
```
Has Fence                                         →  +15
No Fence                                          →  -10

Has Trained Guards                                →  +20
No Guards                                         →  -15

Has CCTV                                          →  +10
No CCTV                                           →    0
```

### Incidents (per recorded incident)
```
Each incident (verified)                          →  -30
(Theft, assault, trespassing, etc.)
```

### CRITICAL RULE - HIGH-Risk Zone Requirements
```
IF (risk_zone == 'HIGH' AND no_guards AND no_fence)
    score -= 20  // Critical gap penalty
```

**FORMULA**:
```
score = 50
score += risk_zone_adjustment
score += (has_fence ? 15 : -10)
score += (has_guards ? 20 : -15)
score += (has_cctv ? 10 : 0)
score += (incident_count × -30)
if (HIGH_RISK && !guards && !fence) score -= 20
score = clamp(score, 0, 100)
```

**SECURITY LEVELS**:
```
score ≥ 70            →  HIGH        (Safe)
40 ≤ score < 70       →  MEDIUM      (Acceptable)
score < 40            →  LOW         (Inadequate)
```

---

## 4️⃣ TEACHER QUALITY (0-100 points, weight: 20%)

**Formula**: 
```
quality_score = qualification_score + diversity_score + ratio_score
(0-30) + (0-30) + (0-40) = 0-100
```

### Qualification Component (0-30 points)
```
qualified_percentage = (qualified_teachers / total_teachers) × 100

≥90%                  →   30 points
≥75%                  →   25 points
≥60%                  →   20 points
≥45%                  →   15 points
≥30%                  →   10 points
<30%                  →    5 points
```

### Diversity Component (0-30 points)
Rewards schools with balanced subject distribution (no single subject >40% of staff)

```
Max concentration ≤40%     →   30 points  (Very diverse)
Max concentration ≤50%     →   25 points  (Good diversity)
Max concentration ≤60%     →   20 points  (Acceptable)
Max concentration ≤70%     →   15 points  (Limited)
Max concentration >70%     →   10 points  (Low diversity)
```

### Ratio Component (0-40 points)

**Recommended Ratios by Level**:
```
ECDE:        1:20 (ideal range: 1:15-25)
PRIMARY:     1:35 (ideal range: 1:30-40)
SECONDARY:   1:30 (ideal range: 1:25-35)
TVET:        1:25 (ideal range: 1:20-30)
```

**Scoring**:
```
actual_ratio ≤ recommended_ideal     →   40 points
actual_ratio ≤ recommended * 1.10    →   35 points
actual_ratio ≤ recommended * 1.20    →   30 points
actual_ratio ≤ recommended * 1.30    →   25 points
actual_ratio ≤ recommended * 1.50    →   15 points
actual_ratio > recommended * 1.50    →    5 points (minimum)
```

---

## 5️⃣ CURRICULUM OFFERINGS (0-100 points, weight: 15%)

**Base Score**: 40 points (all schools)

### Course Diversity (0-30 points)
```
Per course (up to max of 30):
Each course added                     →   +2 points (max +30)
Total 15+ courses                     →   +30 points
```

### Subject Distribution (0-20 points)
```
Has STEM courses                      →  +10 points
Has ARTS courses                      →  +10 points
Has SCIENCE courses                   →  +5 points
(Points can overlap if school has multiple)
```

### Special Programs (0-10 points)
```
Has Sports program                    →   +5 points
Has Music program                     →   +5 points
Has Vocational program                →   +5 points
```

**FORMULA**:
```
base = 40
course_points = min((course_count × 2), 30)
subject_points = (has_stem × 10) + (has_arts × 10)
special_points = (has_sports × 5) + (has_music × 5)
total = base + course_points + subject_points + special_points
score = min(total, 100)
```

**Curriculum Types**:
```
STEM courses ≥50% of total            →  STEM-FOCUSED
ARTS courses ≥50% of total            →  ARTS-FOCUSED
SCIENCE + TECHNICAL ≥40% each         →  SCIENCE-TECHNICAL
Otherwise                             →  GENERAL
```

---

## 6️⃣ ACCESSIBILITY (0-100 points, weight: 10%)

**Haversine Distance Formula**:
```
d = 6371 × acos(
    cos(lat1) × cos(lat2) × cos(lon2 - lon1) +
    sin(lat1) × sin(lat2)
)

Where:
d = distance in kilometers
6371 = Earth's mean radius in kilometers
lat1, lon1 = Parent's GPS coordinates
lat2, lon2 = School's GPS coordinates
```

**Scoring by Distance**:
```
<1 km   (VERY_CLOSE)      →  100 points  (Walking distance)
<5 km   (CLOSE)           →   85 points  (Easy access)
<10 km  (MODERATE)        →   70 points  (Reasonable)
<20 km  (FAR)             →   50 points  (Daily commute)
<40 km  (VERY_FAR)        →   30 points  (Weekly boarding)
≥40 km                    →   10 points  (Boarder preferred)
```

**Travel Time Estimates** (by mode):
```
Speed factors (km/h):
- Walking:      4 km/h
- Cycling:     12 km/h
- Matatu:      25 km/h (includes stops)
- Motorcycle:  40 km/h
- Car:         50 km/h
- Highway:     80 km/h

Traffic adjustments:
- Morning rush (7-9am):     ×1.5
- Evening rush (4-6pm):     ×1.8
- Normal hours:             ×1.0
```

**Transport Cost Estimates** (per km):
```
Walking:     0 KES/km
Cycling:     0 KES/km
Matatu:      3 KES/km (typical ~10-15 KES minimum)
Motorcycle:  5 KES/km
Car:        10 KES/km (gas + depreciation + maintenance)

Monthly cost (5 school days/week):
Cost = distance × 2 (round trip) × cost_per_km × 5 days × 4.2 weeks
```

---

## 🗺️ LOCATION DETECTION RULES

**ASAL Counties** (9 - Automatic FREE Fees):
```
Turkana, Marsabit, Mandera, Wajir, Garissa,
Samburu, Isiolo, Lamu, Tana River

Rule: ANY school in these counties → fees_policy = 'FREE' (automatic)
      No override possible
      Cannot be manually changed
```

**Zone Classification**:
```
IF county IN ASAL_COUNTIES           →  zone_type = 'ASAL'
ELSE IF distance_from_city_center < 15km  →  zone_type = 'URBAN'
ELSE                                       →  zone_type = 'RURAL'

Where city_centers = (Nairobi, Mombasa, Kisumu, etc.)
```

---

## 🔐 AUDIT LOGGING

**Every Detection Logged To**:
1. **File**: `logs/{service}.log` (one JSON per line)
2. **Database**: `audit_logs` table (immutable)

**Event Types**:
```
LOCATION_DETECTED       → When LocationService.detectZoneType() called
ENVIRONMENT_ANALYZED    → When EnvironmentService.analyzeEnvironment() called
SECURITY_ASSESSED       → When SecurityService.calculateSecurityScore() called
RATING_CALCULATED       → When ScoringEngine.calculateCompositeScore() called
INCIDENT_RECORDED       → When SecurityService.recordIncident() called
```

**Log Entry Structure**:
```json
{
    "school_id": 5,
    "event_type": "RATING_CALCULATED",
    "event_description": "Composite rating: 76 (4.5 stars)",
    "timestamp": "2026-01-15T10:45:00Z",
    "source": "AUTO_CALCULATION",
    "details": {
        "overall_score": 76,
        "star_rating": 4.5,
        "components": {
            "fee_affordability": 80,
            "environment": 65,
            "security": 75,
            "teachers": 78,
            "curriculum": 72,
            "accessibility": 85
        }
    }
}
```

---

## 📊 CONFIDENCE LEVELS

**HIGH** (≥80% data complete):
- All indicators present
- GPS verified
- Teachers registered
- Environment analyzed
- Security assessed

**MEDIUM** (50-80% data complete):
- Most indicators present
- Some data estimated
- Reasonable reliability

**LOW** (<50% data complete):
- Incomplete data
- Many estimates
- Use with caution

---

## 🔑 KEY CONSTANTS

**ASAL Counties (9)**:
```
Turkana, Marsabit, Mandera, Wajir, Garissa,
Samburu, Isiolo, Lamu, Tana River
```

**High-Risk Zones (4)**:
```
Nairobi, Mombasa, Kisumu, Nakuru
```

**Medium-Risk Zones (8)**:
```
Eldoret, Nyeri, Machakos, Nakuru County, 
Kajiado, Bomet, Kisii, Migori
```

**Distance Categories (5)**:
```
VERY_CLOSE:  <1 km
CLOSE:       1-5 km
MODERATE:    5-15 km
FAR:         15-30 km
VERY_FAR:    >30 km
```

**Environment Types (3)**:
```
CALM:        75-100 score
MODERATE:    50-74 score
BUSY:        0-49 score
```

**Security Levels (3)**:
```
HIGH:        ≥70 score
MEDIUM:      40-69 score
LOW:         <40 score
```

**Curriculum Types (4)**:
```
STEM-FOCUSED:        STEM courses ≥50%
ARTS-FOCUSED:        ARTS courses ≥50%
SCIENCE-TECHNICAL:   SCIENCE + TECHNICAL both ≥40%
GENERAL:             Everything else
```

---

## 💡 EXAMPLE CALCULATIONS

### Example 1: Urban School Calculation
```
Input School Data:
- County: Nairobi (URBAN)
- Annual Tuition: 45,000 KES
- Compound: 2.5 acres, has green space
- Noise: MODERATE, Congestion: MODERATE
- Fence: YES (good), Guards: YES (2), CCTV: YES
- Incidents: 0
- Teachers: 18 total, 15 qualified (83%)
- Ratio: 1:25 (450 students ÷ 18 teachers)
- Courses: 18 (STEM-focused)
- Distance: 4.2 km from parent

Component Scores:
Fee:           80  (45k/year ≈ 10% income)
Environment:   65  (MODERATE: -15 urban + 10 compound + 10 green - 0 noise 0 congestion = base 50 + 15 = 65)
Security:      75  (base 50 - 15 HIGH-risk + 15 fence + 20 guards + 10 CCTV = 80, but clamped to 75)
Teachers:      78  (qualification 25 + diversity 25 + ratio 28 = 78)
Curriculum:    72  (base 40 + courses 24 + subjects 8 = 72)
Accessibility: 85  (4.2 km)

COMPOSITE CALCULATION:
= (80 × 0.25) + (65 × 0.15) + (75 × 0.15) + (78 × 0.20) + (72 × 0.15) + (85 × 0.10)
= 20 + 9.75 + 11.25 + 15.6 + 10.8 + 8.5
= 75.9 ≈ 76

RATING: 76 → ★★★★☆ 4.5 stars → "Good School"
```

### Example 2: ASAL School Calculation
```
Input School Data:
- County: Turkana (ASAL)
- Annual Tuition: AUTOMATIC FREE
- Compound: 1.5 acres, some green space
- Noise: LOW, Congestion: LOW
- Fence: NO, Guards: NO, CCTV: NO
- Incidents: 0
- Teachers: 8 total, 5 qualified (63%)
- Ratio: 1:40 (320 students ÷ 8 teachers)
- Courses: 8 (GENERAL)
- Distance: 0.5 km from parent

Component Scores:
Fee:           100  (ASAL = automatic 100)
Environment:   85   (+20 ASAL + 5 small compound + 10 green + 15 low noise + 10 low congestion = base 50 + 60 = clamped to 85)
Security:      30   (base 50 + 5 LOW-risk - 10 no fence - 15 no guards + 0 no CCTV = 30)
Teachers:      60   (qualification 12 + diversity 18 + ratio 30 = 60)
Curriculum:    55   (base 40 + courses 8 + subjects 7 = 55)
Accessibility: 100  (0.5 km)

COMPOSITE CALCULATION:
= (100 × 0.25) + (85 × 0.15) + (30 × 0.15) + (60 × 0.20) + (55 × 0.15) + (100 × 0.10)
= 25 + 12.75 + 4.5 + 12 + 8.25 + 10
= 72.5 ≈ 72.5

RATING: 72.5 → ★★★★☆ 4.5 stars → "Good School (despite low infrastructure)"

NOTE: FREE fees (+25% component) boost score significantly despite poor security.
      This rewards ASAL schools' mission to serve remote areas.
```

---

## ✅ VALIDATION RULES

**GPS Validation**:
```
Kenya Bounds:
- Latitude:   -4.67 to 5.00
- Longitude:  28.33 to 41.91

Any coordinates outside these bounds → ERROR
```

**Distance Validation**:
```
Haversine result < 0.01 km (10 meters) → Potential GPS error, investigate
Haversine result > 500 km → Out of Kenya, error
```

**Teacher Data Validation**:
```
student_count ≥ 1 AND teacher_count ≥ 1 → VALID
student_count = 0 OR teacher_count = 0 → ERROR
ratio > 100 (more teachers than students) → WARNING

Qualified teachers must be ≤ total teachers
Subject percentages must sum to ~100%
```

**Courses Validation**:
```
course_name required
category must be in CATEGORIES list
level must be in LEVELS list
course_name cannot be duplicate within school
```

---

## 📞 SUPPORT & REFERENCE

**File Locations**:
- Services: `server/services/`
- Models: `server/models/`
- Routes: `server/routes/intelligence.routes.js`
- UI: `public/school-*.html`
- Docs: `docs/PHASE4_LOCATION_INTELLIGENCE.md`

**API Base**: `/api`

**Example Requests**:
```
GET /api/schools/5/profile
POST /api/intelligence/schools/5/calculate-rating
GET /api/intelligence/schools/search?env=CALM&security=HIGH
```

**Log Files**:
- `logs/location.log`
- `logs/environment.log`
- `logs/security.log`
- `logs/distance.log`
- `logs/ratings.log`

---

*This is a quick reference guide. For complete details, see:*
- **docs/PHASE4_LOCATION_INTELLIGENCE.md** (1,500+ lines)
- **PHASE4_INTEGRATION_GUIDE.js** (comprehensive checklist)
