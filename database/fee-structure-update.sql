-- KENYA SCHOOL FEE STRUCTURE UPDATE
-- Based on Government of Kenya Fee Guidelines (2026)
-- KSFP - Kenya School Fee Platform

-- =====================================================
-- FEE STRUCTURE TABLES
-- =====================================================

-- Government Fee Guidelines Table
CREATE TABLE IF NOT EXISTS fee_guidelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_level ENUM('ecde', 'primary', 'secondary', 'tvet', 'university') NOT NULL,
    school_type ENUM('public', 'private', 'special') NOT NULL,
    constituency VARCHAR(100),
    county VARCHAR(100),

    -- Fee Structure (per term in KES)
    tuition_fee INTEGER DEFAULT 0,
    enrollment_fee INTEGER DEFAULT 0,
    development_fee INTEGER DEFAULT 0,
    activity_fee INTEGER DEFAULT 0,
    lunch_fee INTEGER DEFAULT 0,

    -- Government Subsidies
    government_subsidy DECIMAL(5,2) DEFAULT 0, -- Percentage
    is_free BOOLEAN DEFAULT FALSE,
    free_lunch BOOLEAN DEFAULT FALSE,

    -- Special Programs
    is_cbc_school BOOLEAN DEFAULT FALSE,
    is_day_school BOOLEAN DEFAULT FALSE,
    is_boarding_school BOOLEAN DEFAULT FALSE,

    -- Effective Dates
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE NULL,

    -- Metadata
    source VARCHAR(255) DEFAULT 'Government of Kenya',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_fee_guideline (school_level, school_type, constituency, effective_from)
);

-- School Fee Assignments Table
CREATE TABLE IF NOT EXISTS school_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id VARCHAR(50) NOT NULL,
    guideline_id INTEGER,

    -- Actual Fees (may differ from guidelines)
    tuition_fee INTEGER DEFAULT 0,
    enrollment_fee INTEGER DEFAULT 0,
    development_fee INTEGER DEFAULT 0,
    activity_fee INTEGER DEFAULT 0,
    lunch_fee INTEGER DEFAULT 0,

    -- Total Calculations
    term_total INTEGER DEFAULT 0,
    annual_total INTEGER DEFAULT 0,

    -- Payment Terms
    terms_per_year INTEGER DEFAULT 3,
    payment_deadlines JSON, -- Store as JSON array of dates

    -- Special Conditions
    has_scholarship BOOLEAN DEFAULT FALSE,
    scholarship_percentage DECIMAL(5,2) DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,

    -- Audit Trail
    set_by VARCHAR(100) DEFAULT 'system',
    approved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (guideline_id) REFERENCES fee_guidelines(id) ON DELETE SET NULL,
    INDEX idx_school_fee (school_id),
    INDEX idx_fee_guideline (guideline_id)
);

-- =====================================================
-- GOVERNMENT FEE GUIDELINES DATA
-- =====================================================

INSERT OR REPLACE INTO fee_guidelines
(school_level, school_type, constituency, county, tuition_fee, enrollment_fee, development_fee, activity_fee, lunch_fee, government_subsidy, is_free, free_lunch, is_cbc_school, is_day_school, is_boarding_school, source)
VALUES
-- CBC Senior Schools (Competency Based Curriculum)
('secondary', 'public', NULL, NULL, 52600, 2000, 1500, 1000, 500, 0, FALSE, TRUE, TRUE, FALSE, TRUE, 'Government of Kenya - CBC Implementation 2026'),

-- Day Schools (Free Education)
('primary', 'public', NULL, NULL, 0, 0, 0, 0, 0, 100, TRUE, TRUE, FALSE, TRUE, FALSE, 'Government of Kenya - Free Primary Education'),
('secondary', 'public', NULL, NULL, 0, 0, 0, 0, 0, 100, TRUE, TRUE, FALSE, TRUE, FALSE, 'Government of Kenya - Free Secondary Education'),

-- Special Constituency Rates
('primary', 'public', 'Kiharu', 'Muranga', 500, 0, 0, 0, 0, 95, FALSE, TRUE, FALSE, TRUE, FALSE, 'Government of Kenya - Kiharu Constituency Program'),
('secondary', 'public', 'Kiharu', 'Muranga', 500, 0, 0, 0, 0, 95, FALSE, TRUE, FALSE, TRUE, FALSE, 'Government of Kenya - Kiharu Constituency Program'),

('primary', 'public', 'Mumias East', 'Kakamega', 1300, 0, 0, 0, 0, 85, FALSE, TRUE, FALSE, TRUE, FALSE, 'Government of Kenya - Mumias East Constituency Program'),
('secondary', 'public', 'Mumias East', 'Kakamega', 1300, 0, 0, 0, 0, 85, FALSE, TRUE, FALSE, TRUE, FALSE, 'Government of Kenya - Mumias East Constituency Program'),

-- Standard Public School Rates (Non-Free Zones)
('primary', 'public', NULL, NULL, 2500, 500, 300, 200, 0, 70, FALSE, TRUE, FALSE, FALSE, FALSE, 'Government of Kenya - Standard Rates'),
('secondary', 'public', NULL, NULL, 8500, 1000, 800, 500, 0, 60, FALSE, TRUE, FALSE, FALSE, FALSE, 'Government of Kenya - Standard Rates'),

-- Private School Rates (No Government Subsidy)
('primary', 'private', NULL, NULL, 15000, 5000, 3000, 2000, 1500, 0, FALSE, FALSE, FALSE, FALSE, FALSE, 'Private School Association'),
('secondary', 'private', NULL, NULL, 35000, 8000, 5000, 3000, 2000, 0, FALSE, FALSE, FALSE, FALSE, FALSE, 'Private School Association'),

-- Special Schools (Exceptional Children)
('primary', 'special', NULL, NULL, 5000, 1000, 500, 300, 0, 50, FALSE, TRUE, FALSE, FALSE, FALSE, 'Government of Kenya - Special Education'),
('secondary', 'special', NULL, NULL, 12000, 2000, 1000, 500, 0, 40, FALSE, TRUE, FALSE, FALSE, FALSE, 'Government of Kenya - Special Education'),

-- TVET/Technical Schools
('tvet', 'public', NULL, NULL, 18000, 2000, 1500, 1000, 0, 30, FALSE, FALSE, FALSE, FALSE, TRUE, 'Government of Kenya - TVET Program'),
('tvet', 'private', NULL, NULL, 45000, 5000, 4000, 3000, 0, 0, FALSE, FALSE, FALSE, FALSE, TRUE, 'Private TVET Association'),

-- University Rates (Approximate)
('university', 'public', NULL, NULL, 45000, 5000, 3000, 2000, 0, 20, FALSE, FALSE, FALSE, FALSE, TRUE, 'Government of Kenya - University Education'),
('university', 'private', NULL, NULL, 120000, 15000, 10000, 5000, 0, 0, FALSE, FALSE, FALSE, FALSE, TRUE, 'Private University Association');

-- =====================================================
-- UPDATE EXISTING SCHOOLS WITH FEE STRUCTURES
-- =====================================================

-- Update schools table to include fee information
UPDATE schools SET
    annual_tuition = CASE
        WHEN school_type = 'SECONDARY' AND name LIKE '%CBC%' THEN 52600 * 3
        WHEN school_type = 'PRIMARY' AND county = 'Muranga' AND sub_county LIKE '%Kiharu%' THEN 500 * 3
        WHEN school_type = 'SECONDARY' AND county = 'Muranga' AND sub_county LIKE '%Kiharu%' THEN 500 * 3
        WHEN school_type = 'PRIMARY' AND county = 'Kakamega' AND sub_county LIKE '%Mumias East%' THEN 1300 * 3
        WHEN school_type = 'SECONDARY' AND county = 'Kakamega' AND sub_county LIKE '%Mumias East%' THEN 1300 * 3
        WHEN school_type = 'PRIMARY' AND zone_type = 'ASAL' THEN 0
        WHEN school_type = 'SECONDARY' AND zone_type = 'ASAL' THEN 0
        WHEN school_type = 'PRIMARY' THEN 2500 * 3
        WHEN school_type = 'SECONDARY' THEN 8500 * 3
        ELSE annual_tuition
    END,
    fees_policy = CASE
        WHEN school_type IN ('PRIMARY', 'SECONDARY') AND zone_type = 'ASAL' THEN 'FREE'
        WHEN school_type IN ('PRIMARY', 'SECONDARY') AND county = 'Muranga' AND sub_county LIKE '%Kiharu%' THEN 'STANDARD'
        WHEN school_type IN ('PRIMARY', 'SECONDARY') AND county = 'Kakamega' AND sub_county LIKE '%Mumias East%' THEN 'STANDARD'
        WHEN school_type = 'SECONDARY' AND name LIKE '%CBC%' THEN 'PREMIUM'
        ELSE fees_policy
    END,
    lunch_program = CASE
        WHEN school_type IN ('PRIMARY', 'SECONDARY') THEN TRUE
        ELSE lunch_program
    END
WHERE annual_tuition = 0 OR annual_tuition IS NULL;

-- =====================================================
-- SAMPLE SCHOOL FEE ASSIGNMENTS
-- =====================================================

INSERT OR IGNORE INTO school_fees
(school_id, tuition_fee, enrollment_fee, development_fee, activity_fee, lunch_fee, term_total, annual_total, terms_per_year, is_free, set_by)
SELECT
    s.id,
    CASE
        WHEN s.school_type = 'SECONDARY' AND s.name LIKE '%CBC%' THEN 52600
        WHEN s.school_type = 'PRIMARY' AND s.county = 'Muranga' THEN 500
        WHEN s.school_type = 'SECONDARY' AND s.county = 'Muranga' THEN 500
        WHEN s.school_type = 'PRIMARY' AND s.county = 'Kakamega' THEN 1300
        WHEN s.school_type = 'SECONDARY' AND s.county = 'Kakamega' THEN 1300
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 2500
        WHEN s.school_type = 'SECONDARY' THEN 8500
        ELSE 0
    END as tuition_fee,
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 500
        WHEN s.school_type = 'SECONDARY' THEN 1000
        ELSE 0
    END as enrollment_fee,
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 300
        WHEN s.school_type = 'SECONDARY' THEN 800
        ELSE 0
    END as development_fee,
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 200
        WHEN s.school_type = 'SECONDARY' THEN 500
        ELSE 0
    END as activity_fee,
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        ELSE 0
    END as lunch_fee,
    -- Term total calculation
    (CASE
        WHEN s.school_type = 'SECONDARY' AND s.name LIKE '%CBC%' THEN 52600
        WHEN s.school_type = 'PRIMARY' AND s.county = 'Muranga' THEN 500
        WHEN s.school_type = 'SECONDARY' AND s.county = 'Muranga' THEN 500
        WHEN s.school_type = 'PRIMARY' AND s.county = 'Kakamega' THEN 1300
        WHEN s.school_type = 'SECONDARY' AND s.county = 'Kakamega' THEN 1300
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 2500
        WHEN s.school_type = 'SECONDARY' THEN 8500
        ELSE 0
    END +
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 500
        WHEN s.school_type = 'SECONDARY' THEN 1000
        ELSE 0
    END +
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 300
        WHEN s.school_type = 'SECONDARY' THEN 800
        ELSE 0
    END +
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 200
        WHEN s.school_type = 'SECONDARY' THEN 500
        ELSE 0
    END) as term_total,
    -- Annual total (3 terms)
    ((CASE
        WHEN s.school_type = 'SECONDARY' AND s.name LIKE '%CBC%' THEN 52600
        WHEN s.school_type = 'PRIMARY' AND s.county = 'Muranga' THEN 500
        WHEN s.school_type = 'SECONDARY' AND s.county = 'Muranga' THEN 500
        WHEN s.school_type = 'PRIMARY' AND s.county = 'Kakamega' THEN 1300
        WHEN s.school_type = 'SECONDARY' AND s.county = 'Kakamega' THEN 1300
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 2500
        WHEN s.school_type = 'SECONDARY' THEN 8500
        ELSE 0
    END +
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 500
        WHEN s.school_type = 'SECONDARY' THEN 1000
        ELSE 0
    END +
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 300
        WHEN s.school_type = 'SECONDARY' THEN 800
        ELSE 0
    END +
    CASE
        WHEN s.zone_type = 'ASAL' THEN 0
        WHEN s.school_type = 'PRIMARY' THEN 200
        WHEN s.school_type = 'SECONDARY' THEN 500
        ELSE 0
    END) * 3) as annual_total,
    3 as terms_per_year,
    CASE WHEN s.zone_type = 'ASAL' THEN TRUE ELSE FALSE END as is_free,
    'system_auto_update'
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM school_fees sf WHERE sf.school_id = s.id
);

-- =====================================================
-- VIEWS FOR EASY FEE QUERIES
-- =====================================================

CREATE VIEW IF NOT EXISTS school_fee_summary AS
SELECT
    s.id,
    s.name,
    s.school_type,
    s.county,
    s.sub_county,
    s.zone_type,
    s.is_asal,
    sf.tuition_fee,
    sf.enrollment_fee,
    sf.development_fee,
    sf.activity_fee,
    sf.lunch_fee,
    sf.term_total,
    sf.annual_total,
    sf.is_free,
    sf.has_scholarship,
    sf.scholarship_percentage,
    CASE
        WHEN sf.is_free THEN 'FREE'
        WHEN sf.annual_total < 15000 THEN 'AFFORDABLE'
        WHEN sf.annual_total < 50000 THEN 'MODERATE'
        ELSE 'EXPENSIVE'
    END as affordability_category
FROM schools s
LEFT JOIN school_fees sf ON s.id = sf.school_id;

-- =====================================================
-- FEE AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS fee_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id VARCHAR(50) NOT NULL,
    action ENUM('CREATED', 'UPDATED', 'DELETED') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100) DEFAULT 'system',
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_school_audit (school_id),
    INDEX idx_change_date (changed_at)
);

-- =====================================================
-- USEFUL QUERIES FOR THE APPLICATION
-- =====================================================

-- Get all free schools
-- SELECT * FROM school_fee_summary WHERE is_free = TRUE;

-- Get schools by affordability
-- SELECT * FROM school_fee_summary WHERE affordability_category = 'AFFORDABLE';

-- Get schools in specific constituency with special rates
-- SELECT * FROM school_fee_summary WHERE county = 'Muranga' AND sub_county LIKE '%Kiharu%';

-- Get CBC senior schools
-- SELECT * FROM school_fee_summary WHERE school_type = 'SECONDARY' AND tuition_fee = 52600;