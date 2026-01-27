-- PHASE 5: ADMIN DASHBOARD DATABASE SCHEMA
-- Kenya School Fee Platform (KSFP)
-- Date: January 27, 2026

-- =====================================================
-- ADMIN DASHBOARD TABLES
-- =====================================================

-- School Administration Hierarchy Table
CREATE TABLE IF NOT EXISTS school_administration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    institution_type ENUM('university', 'college', 'vocational', 'senior_school', 'junior_school') NOT NULL,

    -- Leadership (varies by institution type)
    head_title VARCHAR(100), -- Vice Chancellor, Principal, Director, Head Teacher
    head_name VARCHAR(255),
    head_qualification VARCHAR(255),
    head_contact VARCHAR(50),
    head_email VARCHAR(255),

    deputy_title VARCHAR(100), -- Deputy VC, Deputy Principal, etc.
    deputy_name VARCHAR(255),
    deputy_qualification VARCHAR(255),
    deputy_contact VARCHAR(50),
    deputy_email VARCHAR(255),

    -- Administration
    registrar_name VARCHAR(255),
    registrar_contact VARCHAR(50),
    registrar_email VARCHAR(255),

    deputy_registrar_name VARCHAR(255),
    deputy_registrar_contact VARCHAR(50),
    deputy_registrar_email VARCHAR(255),

    -- Academic Leadership
    academic_director_name VARCHAR(255),
    academic_director_contact VARCHAR(50),
    academic_director_email VARCHAR(255),

    -- Support Staff Count
    admin_staff_count INTEGER DEFAULT 0,
    academic_staff_count INTEGER DEFAULT 0,
    support_staff_count INTEGER DEFAULT 0,
    total_staff_count INTEGER DEFAULT 0,

    -- Auto-detection flags
    auto_detected BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id)
);

-- Staff Hierarchy Table (Detailed organizational structure)
CREATE TABLE IF NOT EXISTS staff_hierarchy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    staff_id VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated unique ID

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(100), -- Professor, Dr., Mr., Mrs., etc.
    gender ENUM('male', 'female', 'other'),
    date_of_birth DATE,
    nationality VARCHAR(100) DEFAULT 'Kenyan',

    -- Contact Information
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),

    -- Professional Information
    position VARCHAR(255) NOT NULL, -- Vice Chancellor, HOD, Teacher, etc.
    department VARCHAR(255),
    qualification VARCHAR(500), -- CSV of qualifications
    specialization VARCHAR(255),
    years_experience INTEGER DEFAULT 0,

    -- Employment Details
    employment_type ENUM('permanent', 'contract', 'part_time', 'volunteer') DEFAULT 'permanent',
    hire_date DATE,
    contract_end_date DATE,
    salary_grade VARCHAR(50),
    staff_number VARCHAR(100),

    -- Performance Tracking
    performance_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100
    last_performance_review DATE,
    performance_notes TEXT,

    -- Administrative Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_head_of_department BOOLEAN DEFAULT FALSE,
    is_senior_staff BOOLEAN DEFAULT FALSE,
    can_upload BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_school_staff (school_id, position),
    INDEX idx_staff_active (is_active),
    INDEX idx_department (department)
);

-- School History Table
CREATE TABLE IF NOT EXISTS school_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,

    -- Historical Data
    record_type ENUM('performance', 'transition', 'administration', 'accreditation', 'infrastructure') NOT NULL,
    record_date DATE NOT NULL,
    record_title VARCHAR(255) NOT NULL,
    record_description TEXT,

    -- Performance Data (if applicable)
    performance_year INTEGER,
    performance_score DECIMAL(5,2),
    performance_deviation DECIMAL(5,2), -- Deviation from expected
    teacher_count INTEGER,
    student_count INTEGER,

    -- Transition Data (if applicable)
    transition_type ENUM('university_admission', 'senior_school', 'graduation', 'transfer'),
    students_affected INTEGER,
    destination_school VARCHAR(255),
    transition_success_rate DECIMAL(5,2),

    -- Administration Changes (if applicable)
    previous_head VARCHAR(255),
    new_head VARCHAR(255),
    change_reason TEXT,

    -- Accreditation Data (if applicable)
    accreditation_body VARCHAR(255),
    accreditation_level VARCHAR(100),
    accreditation_expiry DATE,

    -- Documents
    document_path VARCHAR(500),
    document_type VARCHAR(100),

    -- Audit
    recorded_by VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_school_history (school_id, record_type, record_date),
    INDEX idx_performance_year (performance_year),
    INDEX idx_transition_type (transition_type)
);

-- Performance Tracking Table
CREATE TABLE IF NOT EXISTS performance_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    tracking_period VARCHAR(50) NOT NULL, -- '2024-Q1', '2024-Term1', etc.

    -- Overall Performance
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    expected_score DECIMAL(5,2) DEFAULT 0.00,
    performance_deviation DECIMAL(5,2) DEFAULT 0.00, -- (actual - expected)

    -- Component Scores
    academic_performance DECIMAL(5,2) DEFAULT 0.00,
    teacher_performance DECIMAL(5,2) DEFAULT 0.00,
    infrastructure_score DECIMAL(5,2) DEFAULT 0.00,
    student_satisfaction DECIMAL(5,2) DEFAULT 0.00,

    -- Teacher Metrics
    total_teachers INTEGER DEFAULT 0,
    qualified_teachers INTEGER DEFAULT 0,
    teacher_student_ratio DECIMAL(5,2) DEFAULT 0.00,
    teacher_turnover_rate DECIMAL(5,2) DEFAULT 0.00,

    -- Student Metrics
    total_students INTEGER DEFAULT 0,
    student_teacher_ratio DECIMAL(5,2) DEFAULT 0.00,
    graduation_rate DECIMAL(5,2) DEFAULT 0.00,
    transition_success_rate DECIMAL(5,2) DEFAULT 0.00,

    -- Alerts and Flags
    performance_alert BOOLEAN DEFAULT FALSE,
    alert_reason TEXT,
    improvement_required BOOLEAN DEFAULT FALSE,
    improvement_areas TEXT,

    -- Audit
    calculated_by VARCHAR(100),
    calculation_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, tracking_period),
    INDEX idx_performance_period (tracking_period),
    INDEX idx_performance_alert (performance_alert)
);

-- Document Uploads Table
CREATE TABLE IF NOT EXISTS document_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,

    -- Document Information
    document_type ENUM('logo', 'accreditation', 'performance_report', 'staff_credential', 'transition_certificate', 'financial_report', 'infrastructure_plan') NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    document_description TEXT,

    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Access Control
    is_public BOOLEAN DEFAULT FALSE,
    access_level ENUM('admin_only', 'school_staff', 'parents', 'public') DEFAULT 'admin_only',
    uploaded_by VARCHAR(100),
    approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(100),
    approval_date TIMESTAMP,

    -- Version Control
    version_number INTEGER DEFAULT 1,
    previous_version_id INTEGER,
    is_current_version BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_version_id) REFERENCES document_uploads(id),
    INDEX idx_document_type (document_type),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_current_version (is_current_version)
);

-- Transition Records Table
CREATE TABLE IF NOT EXISTS transition_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,

    -- Transition Information
    transition_type ENUM('university_admission', 'senior_school_placement', 'graduation', 'transfer', 'dropout') NOT NULL,
    transition_year INTEGER NOT NULL,
    transition_period VARCHAR(50), -- 'Term 1', 'Q1', etc.

    -- Student Information
    student_name VARCHAR(255),
    student_id VARCHAR(100),
    student_gender ENUM('male', 'female', 'other'),
    student_age INTEGER,

    -- Academic Performance
    final_grade VARCHAR(10),
    overall_score DECIMAL(5,2),
    subject_grades TEXT, -- JSON object of subject:grade pairs

    -- Destination Information
    destination_school VARCHAR(255),
    destination_type ENUM('university', 'college', 'senior_school', 'vocational', 'employment', 'other'),
    destination_location VARCHAR(255),

    -- Transition Details
    transition_date DATE,
    transition_success BOOLEAN DEFAULT TRUE,
    transition_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,

    -- Supporting Documents
    certificate_path VARCHAR(500),
    transcript_path VARCHAR(500),

    -- Audit
    recorded_by VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    INDEX idx_transition_type (transition_type, transition_year),
    INDEX idx_student_id (student_id),
    INDEX idx_destination (destination_school)
);

-- School Logos Table (Specialized for uneditable admin fields)
CREATE TABLE IF NOT EXISTS school_logos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,

    -- Logo Information
    logo_title VARCHAR(255) DEFAULT 'School Logo',
    logo_description TEXT,

    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Logo Specifications
    width INTEGER,
    height INTEGER,
    format VARCHAR(10), -- PNG, JPG, SVG

    -- Administrative Control (uneditable by school staff)
    is_official BOOLEAN DEFAULT FALSE,
    approved_by_ministry BOOLEAN DEFAULT FALSE,
    approval_date TIMESTAMP,
    approved_by VARCHAR(100),

    -- Version Control
    version_number INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    replaced_date TIMESTAMP,

    -- Audit (uneditable)
    uploaded_by_system BOOLEAN DEFAULT TRUE, -- Only admins can upload
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, is_current), -- Only one current logo per school
    INDEX idx_current_logo (school_id, is_current)
);

-- =====================================================
-- VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- School Administration Overview
CREATE VIEW school_admin_overview AS
SELECT
    sa.school_id,
    s.name as school_name,
    s.location as school_location,
    sa.institution_type,
    sa.head_title,
    sa.head_name,
    sa.total_staff_count,
    sa.academic_staff_count,
    sa.admin_staff_count,
    sa.last_updated,
    pt.overall_score as current_performance,
    pt.performance_deviation
FROM school_administration sa
JOIN schools s ON sa.school_id = s.id
LEFT JOIN performance_tracking pt ON sa.school_id = pt.school_id
    AND pt.tracking_period = (
        SELECT MAX(tracking_period)
        FROM performance_tracking
        WHERE school_id = sa.school_id
    );

-- Staff Summary by School
CREATE VIEW staff_summary_by_school AS
SELECT
    school_id,
    COUNT(*) as total_staff,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_staff,
    COUNT(CASE WHEN is_head_of_department = TRUE THEN 1 END) as department_heads,
    COUNT(CASE WHEN is_senior_staff = TRUE THEN 1 END) as senior_staff,
    AVG(performance_score) as avg_performance_score,
    AVG(years_experience) as avg_experience
FROM staff_hierarchy
WHERE is_active = TRUE
GROUP BY school_id;

-- Performance Trends View
CREATE VIEW performance_trends AS
SELECT
    school_id,
    tracking_period,
    overall_score,
    performance_deviation,
    LAG(overall_score) OVER (PARTITION BY school_id ORDER BY tracking_period) as previous_score,
    (overall_score - LAG(overall_score) OVER (PARTITION BY school_id ORDER BY tracking_period)) as score_change
FROM performance_tracking
ORDER BY school_id, tracking_period;

-- Transition Success Rates
CREATE VIEW transition_success_rates AS
SELECT
    school_id,
    transition_year,
    transition_type,
    COUNT(*) as total_transitions,
    COUNT(CASE WHEN transition_success = TRUE THEN 1 END) as successful_transitions,
    ROUND(
        (COUNT(CASE WHEN transition_success = TRUE THEN 1 END) * 100.0) / COUNT(*),
        2
    ) as success_rate
FROM transition_records
GROUP BY school_id, transition_year, transition_type;

-- =====================================================
-- TRIGGERS FOR AUDIT TRAILS
-- =====================================================

-- Staff Hierarchy Audit Trigger
CREATE TRIGGER staff_hierarchy_audit
AFTER UPDATE ON staff_hierarchy
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_by,
        change_reason
    ) VALUES (
        'staff_hierarchy',
        NEW.id,
        'UPDATE',
        JSON_OBJECT(
            'full_name', OLD.full_name,
            'position', OLD.position,
            'department', OLD.department,
            'is_active', OLD.is_active,
            'performance_score', OLD.performance_score
        ),
        JSON_OBJECT(
            'full_name', NEW.full_name,
            'position', NEW.position,
            'department', NEW.department,
            'is_active', NEW.is_active,
            'performance_score', NEW.performance_score
        ),
        NEW.updated_by,
        'Staff record updated'
    );
END;

-- Performance Tracking Audit Trigger
CREATE TRIGGER performance_tracking_audit
AFTER INSERT ON performance_tracking
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_by,
        change_reason
    ) VALUES (
        'performance_tracking',
        NEW.id,
        'INSERT',
        NULL,
        JSON_OBJECT(
            'school_id', NEW.school_id,
            'tracking_period', NEW.tracking_period,
            'overall_score', NEW.overall_score,
            'performance_deviation', NEW.performance_deviation
        ),
        NEW.calculated_by,
        'Performance tracking record created'
    );
END;

-- Document Upload Audit Trigger
CREATE TRIGGER document_upload_audit
AFTER INSERT ON document_uploads
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_by,
        change_reason
    ) VALUES (
        'document_uploads',
        NEW.id,
        'INSERT',
        NULL,
        JSON_OBJECT(
            'school_id', NEW.school_id,
            'document_type', NEW.document_type,
            'file_name', NEW.file_name,
            'uploaded_by', NEW.uploaded_by
        ),
        NEW.uploaded_by,
        'Document uploaded'
    );
END;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_school_admin_school_id ON school_administration(school_id);
CREATE INDEX idx_staff_hierarchy_school_active ON staff_hierarchy(school_id, is_active);
CREATE INDEX idx_school_history_school_date ON school_history(school_id, record_date);
CREATE INDEX idx_performance_school_period ON performance_tracking(school_id, tracking_period);
CREATE INDEX idx_documents_school_type ON document_uploads(school_id, document_type);
CREATE INDEX idx_transitions_school_year ON transition_records(school_id, transition_year);
CREATE INDEX idx_logos_school_current ON school_logos(school_id, is_current);

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample school administration for existing schools
INSERT OR IGNORE INTO school_administration (
    school_id, institution_type, head_title, head_name,
    total_staff_count, academic_staff_count, admin_staff_count
) VALUES
(1, 'university', 'Vice Chancellor', 'Prof. John Maina', 150, 120, 30),
(2, 'college', 'Principal', 'Dr. Sarah Wanjiku', 45, 35, 10),
(3, 'senior_school', 'Principal', 'Mr. David Kiprop', 25, 20, 5),
(4, 'junior_school', 'Head Teacher', 'Mrs. Grace Achieng', 12, 10, 2),
(5, 'vocational', 'Director', 'Mr. Peter Oduya', 30, 25, 5);

-- Insert sample staff hierarchy
INSERT OR IGNORE INTO staff_hierarchy (
    school_id, staff_id, full_name, position, department,
    qualification, years_experience, is_active
) VALUES
(1, 'VC001', 'Prof. John Maina', 'Vice Chancellor', 'Administration',
 'PhD Education, MSc Administration', 25, TRUE),
(1, 'REG001', 'Dr. Mary Wanjohi', 'Registrar', 'Administration',
 'PhD Administration, MBA', 15, TRUE),
(2, 'PRIN001', 'Dr. Sarah Wanjiku', 'Principal', 'Administration',
 'PhD Education, MEd', 12, TRUE),
(3, 'PRIN002', 'Mr. David Kiprop', 'Principal', 'Administration',
 'MEd, BEd', 18, TRUE);

-- Insert sample performance tracking
INSERT OR IGNORE INTO performance_tracking (
    school_id, tracking_period, overall_score, expected_score,
    total_teachers, total_students, calculated_by
) VALUES
(1, '2024-Q1', 85.50, 82.00, 120, 2500, 'system'),
(2, '2024-Q1', 78.25, 75.00, 35, 800, 'system'),
(3, '2024-Q1', 82.10, 80.00, 20, 450, 'system'),
(4, '2024-Q1', 79.80, 78.00, 10, 200, 'system'),
(5, '2024-Q1', 76.45, 74.00, 25, 300, 'system');

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Calculate Performance Deviation
DELIMITER //
CREATE PROCEDURE CalculatePerformanceDeviation(IN schoolId INT, IN period VARCHAR(50))
BEGIN
    DECLARE actual_score DECIMAL(5,2);
    DECLARE expected_score DECIMAL(5,2);
    DECLARE deviation DECIMAL(5,2);

    SELECT overall_score INTO actual_score
    FROM performance_tracking
    WHERE school_id = schoolId AND tracking_period = period;

    -- Calculate expected score based on school type and historical data
    SELECT AVG(overall_score) * 1.05 INTO expected_score
    FROM performance_tracking
    WHERE school_id = schoolId
    ORDER BY tracking_period DESC
    LIMIT 5;

    SET deviation = actual_score - expected_score;

    UPDATE performance_tracking
    SET expected_score = expected_score,
        performance_deviation = deviation,
        updated_at = CURRENT_TIMESTAMP
    WHERE school_id = schoolId AND tracking_period = period;
END //
DELIMITER ;

-- Update Staff Counts Procedure
DELIMITER //
CREATE PROCEDURE UpdateStaffCounts(IN schoolId INT)
BEGIN
    DECLARE total_count INT;
    DECLARE academic_count INT;
    DECLARE admin_count INT;
    DECLARE support_count INT;

    SELECT COUNT(*) INTO total_count
    FROM staff_hierarchy
    WHERE school_id = schoolId AND is_active = TRUE;

    SELECT COUNT(*) INTO academic_count
    FROM staff_hierarchy
    WHERE school_id = schoolId AND is_active = TRUE
    AND department NOT IN ('Administration', 'Support', 'Maintenance');

    SELECT COUNT(*) INTO admin_count
    FROM staff_hierarchy
    WHERE school_id = schoolId AND is_active = TRUE
    AND department = 'Administration';

    SELECT COUNT(*) INTO support_count
    FROM staff_hierarchy
    WHERE school_id = schoolId AND is_active = TRUE
    AND department IN ('Support', 'Maintenance', 'IT', 'Security');

    UPDATE school_administration
    SET total_staff_count = total_count,
        academic_staff_count = academic_count,
        admin_staff_count = admin_count,
        support_staff_count = support_count,
        last_updated = CURRENT_TIMESTAMP
    WHERE school_id = schoolId;
END //
DELIMITER ;

-- =====================================================
-- END OF SCHEMA
-- =====================================================