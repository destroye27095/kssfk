/**
 * KSFP Phase 4 Database Schema
 * Location, Environment, Intelligence Architecture
 * Tables: School (extended), Location, Environment, Security, TeacherStats, Courses, Ratings
 */

-- ============================================
-- EXTENDED SCHOOL TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    
    -- LOCATION
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    county VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100),
    zone_type ENUM('URBAN', 'RURAL', 'ASAL') DEFAULT 'RURAL',
    is_asal BOOLEAN DEFAULT FALSE,
    
    -- FEES & POLICY
    fees_policy ENUM('FREE', 'STANDARD', 'PREMIUM') DEFAULT 'STANDARD',
    annual_tuition INT DEFAULT 0,
    enrollment_fee INT DEFAULT 0,
    lunch_program BOOLEAN DEFAULT FALSE,
    
    -- SCHOOL INFO
    school_type ENUM('ECDE', 'PRIMARY', 'SECONDARY', 'TVET', 'UNIVERSITY') NOT NULL,
    student_count INT DEFAULT 0,
    compound_size_acres DECIMAL(8, 2),
    has_green_space BOOLEAN DEFAULT FALSE,
    
    -- AUTO-DETECTION RESULTS
    environment_score INT DEFAULT 50,
    environment_type ENUM('CALM', 'MODERATE', 'BUSY') DEFAULT 'MODERATE',
    security_score INT DEFAULT 50,
    security_level ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    
    -- RATINGS
    overall_rating DECIMAL(3, 2) DEFAULT 0,
    rating_score INT DEFAULT 0,
    rating_valid_until TIMESTAMP NULL,
    rating_confidence ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    
    -- CONTACT
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    rating_updated_at TIMESTAMP NULL,
    
    -- INDICES
    INDEX idx_county (county),
    INDEX idx_zone_type (zone_type),
    INDEX idx_rating (overall_rating),
    INDEX idx_location (latitude, longitude),
    UNIQUE KEY unique_school_name (name)
);

-- ============================================
-- LOCATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_locations (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    county VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100),
    zone_type ENUM('URBAN', 'RURAL', 'ASAL'),
    is_asal BOOLEAN DEFAULT FALSE,
    fees_policy_auto ENUM('FREE', 'STANDARD') DEFAULT 'STANDARD',
    
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_zone_type (zone_type),
    INDEX idx_county (county)
);

-- ============================================
-- ENVIRONMENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_environment (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- MEASURED INDICATORS
    compound_size_acres DECIMAL(8, 2),
    has_green_space BOOLEAN DEFAULT FALSE,
    noise_level ENUM('LOW', 'MODERATE', 'HIGH') DEFAULT 'MODERATE',
    congestion ENUM('LOW', 'MODERATE', 'HIGH') DEFAULT 'MODERATE',
    
    -- CALCULATED SCORES
    zone_bonus INT,
    compound_size_score INT,
    green_space_score INT,
    noise_score INT,
    congestion_score INT,
    
    environment_score INT DEFAULT 50,
    environment_type ENUM('CALM', 'MODERATE', 'BUSY') DEFAULT 'MODERATE',
    description TEXT,
    
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_environment_type (environment_type)
);

-- ============================================
-- SECURITY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_security (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- SECURITY INDICATORS
    has_fence BOOLEAN DEFAULT FALSE,
    has_guards BOOLEAN DEFAULT FALSE,
    has_cctv BOOLEAN DEFAULT FALSE,
    
    -- RISK ASSESSMENT
    county VARCHAR(100),
    risk_zone ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    risk_zone_adjustment INT,
    
    -- SCORE BREAKDOWN
    base_score INT DEFAULT 50,
    fence_score INT,
    guards_score INT,
    cctv_score INT,
    incident_score INT DEFAULT 0,
    critical_gap_penalty INT DEFAULT 0,
    
    -- FINAL SCORE
    security_score INT DEFAULT 50,
    security_level ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_security_level (security_level),
    INDEX idx_risk_zone (risk_zone)
);

-- ============================================
-- SECURITY INCIDENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_incidents (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL,
    
    incident_date TIMESTAMP NOT NULL,
    incident_type VARCHAR(100), -- theft, injury, trespassing, etc.
    description TEXT,
    severity ENUM('LOW', 'MEDIUM', 'HIGH'),
    
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_incident_date (incident_date),
    INDEX idx_severity (severity)
);

-- ============================================
-- TEACHER STATISTICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_statistics (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- TEACHER COUNTS
    total_teachers INT NOT NULL,
    qualified_teachers INT DEFAULT 0,
    stem_teachers INT DEFAULT 0,
    arts_teachers INT DEFAULT 0,
    science_teachers INT DEFAULT 0,
    
    -- STUDENT INFO
    student_count INT NOT NULL,
    student_teacher_ratio DECIMAL(5, 2),
    
    -- SCORE BREAKDOWN
    qualification_score INT,
    diversity_score INT,
    ratio_score INT,
    
    teacher_quality_score INT DEFAULT 50,
    
    -- SUBJECT DISTRIBUTION
    stem_percentage INT DEFAULT 0,
    arts_percentage INT DEFAULT 0,
    science_percentage INT DEFAULT 0,
    other_percentage INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_ratio (student_teacher_ratio)
);

-- ============================================
-- COURSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_courses (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL,
    
    course_level ENUM('ECDE', 'PRIMARY', 'SECONDARY', 'TVET', 'UNIVERSITY'),
    course_name VARCHAR(255) NOT NULL,
    course_category ENUM('STEM', 'SCIENCE', 'ARTS', 'TECHNICAL', 'VOCATIONAL', 'SPORTS', 'MUSIC', 'RELIGION'),
    
    duration VARCHAR(100),
    certification VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_category (course_category),
    INDEX idx_level (course_level),
    KEY idx_school_courses (school_id)
);

-- ============================================
-- COMPOSITE RATINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_ratings (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- COMPONENT SCORES (weighted)
    fee_affordability_score INT,
    environment_score INT,
    security_score INT,
    teacher_quality_score INT,
    curriculum_score INT,
    accessibility_score INT,
    
    -- WEIGHTS APPLIED
    fee_affordability_weight INT DEFAULT 25,
    environment_weight INT DEFAULT 15,
    security_weight INT DEFAULT 15,
    teacher_quality_weight INT DEFAULT 20,
    curriculum_weight INT DEFAULT 15,
    accessibility_weight INT DEFAULT 10,
    
    -- FINAL RATING
    overall_score INT NOT NULL,
    star_rating DECIMAL(2, 1) NOT NULL,
    star_visual VARCHAR(10),
    
    -- CONFIDENCE & VALIDITY
    confidence_level ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    data_completeness DECIMAL(3, 2),
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    
    -- BREAKDOWN FOR TRANSPARENCY
    breakdown JSON,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_overall_score (overall_score),
    INDEX idx_star_rating (star_rating),
    INDEX idx_valid_until (valid_until)
);

-- ============================================
-- RATING HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS rating_history (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL,
    
    overall_score INT,
    star_rating DECIMAL(2, 1),
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    -- WHAT CHANGED
    score_change INT,
    reason VARCHAR(255),
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_school_date (school_id, calculated_at)
);

-- ============================================
-- AUDIT LOGS FOR AUTO-DETECTION
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    school_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    
    -- WHAT WAS DETECTED/CALCULATED
    data_field VARCHAR(100),
    old_value VARCHAR(500),
    new_value VARCHAR(500),
    
    -- HOW IT WAS CALCULATED
    calculation_method TEXT,
    source VARCHAR(100), -- 'GPS', 'ADMIN_INPUT', 'AUTO_DETECT'
    
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_event_type (event_type),
    INDEX idx_detected_at (detected_at)
);

-- ============================================
-- DISTANCE/ACCESSIBILITY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS school_accessibility (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL UNIQUE,
    
    -- DISTANCE STATISTICS (from parent access patterns)
    avg_distance_km DECIMAL(8, 2),
    max_distance_km DECIMAL(8, 2),
    min_distance_km DECIMAL(8, 2),
    coverage_area_km DECIMAL(8, 2),
    
    -- PARENT COUNT
    unique_parent_locations INT DEFAULT 0,
    
    -- TRANSPORT ESTIMATE
    recommended_transport_mode VARCHAR(50),
    estimated_travel_time_minutes INT,
    estimated_monthly_cost_kes INT,
    
    distance_category ENUM('VERY_CLOSE', 'CLOSE', 'MODERATE', 'FAR', 'VERY_FAR'),
    accessibility_score INT DEFAULT 50,
    
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_distance_category (distance_category)
);

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

CREATE OR REPLACE VIEW high_rated_schools AS
SELECT 
    id,
    name,
    county,
    zone_type,
    overall_rating,
    environment_type,
    security_level,
    student_teacher_ratio,
    latitude,
    longitude
FROM schools
WHERE overall_rating >= 4.0
ORDER BY overall_rating DESC;

CREATE OR REPLACE VIEW affordable_schools AS
SELECT 
    id,
    name,
    county,
    annual_tuition,
    fees_policy,
    overall_rating,
    student_count
FROM schools
WHERE fees_policy = 'FREE' OR annual_tuition <= 50000
ORDER BY annual_tuition ASC;

CREATE OR REPLACE VIEW safe_schools AS
SELECT 
    id,
    name,
    county,
    security_level,
    has_fence,
    has_guards,
    has_cctv,
    risk_zone,
    overall_rating
FROM school_security
JOIN schools ON schools.id = school_security.school_id
WHERE security_level IN ('HIGH', 'MEDIUM')
ORDER BY security_score DESC;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER $$

CREATE PROCEDURE RecalculateSchoolRating(
    IN p_school_id VARCHAR(50)
)
BEGIN
    DECLARE v_fee_score INT;
    DECLARE v_env_score INT;
    DECLARE v_sec_score INT;
    DECLARE v_teacher_score INT;
    DECLARE v_curr_score INT;
    DECLARE v_access_score INT;
    DECLARE v_total_score INT;
    
    -- Get current scores
    SELECT
        (annual_tuition > 100000 ? 30 : 70) AS fee_score,
        environment_score,
        security_score,
        teacher_quality_score,
        50, -- default curriculum
        50  -- default accessibility
    INTO
        v_fee_score,
        v_env_score,
        v_sec_score,
        v_teacher_score,
        v_curr_score,
        v_access_score
    FROM schools
    WHERE id = p_school_id;
    
    -- Calculate weighted total
    SET v_total_score = 
        (v_fee_score * 25 +
         v_env_score * 15 +
         v_sec_score * 15 +
         v_teacher_score * 20 +
         v_curr_score * 15 +
         v_access_score * 10) / 100;
    
    -- Update schools table
    UPDATE schools
    SET 
        overall_rating = v_total_score / 20,
        rating_score = v_total_score,
        rating_updated_at = NOW()
    WHERE id = p_school_id;
    
END$$

DELIMITER ;

-- ============================================
-- TRIGGERS FOR AUTO-DETECTION LOGGING
-- ============================================

DELIMITER $$

CREATE TRIGGER log_location_detection
AFTER INSERT ON school_locations
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        school_id, event_type, data_field,
        old_value, new_value, source
    ) VALUES (
        NEW.school_id, 'LOCATION_DETECTED', 'zone_type',
        'UNKNOWN', NEW.zone_type, 'GPS'
    );
END$$

CREATE TRIGGER log_environment_analysis
AFTER INSERT ON school_environment
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        school_id, event_type, data_field,
        old_value, new_value, source
    ) VALUES (
        NEW.school_id, 'ENVIRONMENT_ANALYZED', 'environment_score',
        '50', NEW.environment_score, 'AUTO_DETECT'
    );
END$$

CREATE TRIGGER log_security_assessment
AFTER INSERT ON school_security
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        school_id, event_type, data_field,
        old_value, new_value, source
    ) VALUES (
        NEW.school_id, 'SECURITY_ASSESSED', 'security_score',
        '50', NEW.security_score, 'AUTO_DETECT'
    );
END$$

DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_schools_rating ON schools(overall_rating);
CREATE INDEX idx_schools_county ON schools(county);
CREATE INDEX idx_schools_zone ON schools(zone_type);
CREATE INDEX idx_schools_location ON schools(latitude, longitude);

CREATE INDEX idx_environment_score ON school_environment(environment_score);
CREATE INDEX idx_security_score ON school_security(security_score);
CREATE INDEX idx_teacher_ratio ON teacher_statistics(student_teacher_ratio);

CREATE INDEX idx_ratings_score ON school_ratings(overall_score);
CREATE INDEX idx_ratings_valid ON school_ratings(valid_until);

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

INSERT INTO schools (
    id, name, latitude, longitude, county, zone_type,
    fees_policy, annual_tuition, school_type, student_count, compound_size_acres
) VALUES
('sch_001', 'Nairobi Heights Primary', -1.2865, 36.8172, 'Nairobi', 'URBAN',
 'STANDARD', 45000, 'PRIMARY', 320, 2.5),
('sch_002', 'Turkana Nomads School', 3.5833, 35.9667, 'Turkana', 'ASAL',
 'FREE', 0, 'PRIMARY', 120, 5.0),
('sch_003', 'Rural Dream Academy', -0.5, 34.5, 'Rift Valley', 'RURAL',
 'STANDARD', 25000, 'PRIMARY', 250, 3.0);

INSERT INTO teacher_statistics (
    school_id, total_teachers, qualified_teachers,
    stem_teachers, arts_teachers, science_teachers,
    student_count
) VALUES
('sch_001', 15, 14, 5, 4, 5, 320),
('sch_002', 6, 4, 1, 1, 1, 120),
('sch_003', 10, 8, 3, 2, 3, 250);
