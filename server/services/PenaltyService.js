/* ============================================
   PENALTY SERVICE - Enforcement System
   Detects & Penalizes Fake Information
   ============================================ */

const fs = require('fs');
const path = require('path');

class PenaltyService {
    /**
     * Severity levels and penalty amounts
     */
    static PENALTIES = {
        mild: { factor: 0.05, starReduction: 0.5, description: 'Minor inaccuracy' },
        moderate: { factor: 0.10, starReduction: 1.0, description: 'Fake data or misrepresentation' },
        severe: { factor: 0.20, starReduction: 1.5, description: 'Fraud or repeated violations' },
        critical: { factor: 0.50, starReduction: 2.0, description: 'Multiple violations or scam' }
    };

    /**
     * Detect fake information
     * Returns flags and recommended penalty
     */
    static detectFakeInformation(schoolData) {
        const flags = [];

        // Check 1: Vacancy inconsistency
        if (schoolData.vacancies) {
            const totalPosted = schoolData.vacancies.reduce((sum, v) => sum + v.count, 0);
            const totalFilled = schoolData.vacancies.reduce((sum, v) => sum + (v.filled || 0), 0);

            if (totalFilled > totalPosted) {
                flags.push({
                    type: 'VACANCY_FRAUD',
                    severity: 'severe',
                    message: `More students filled (${totalFilled}) than vacancies posted (${totalPosted})`,
                    evidence: { totalPosted, totalFilled }
                });
            }
        }

        // Check 2: Duplicate upload
        if (schoolData.uploads && schoolData.uploads.length > 0) {
            const hashes = new Map();
            schoolData.uploads.forEach(upload => {
                const hash = this.hashFile(upload.file);
                if (hashes.has(hash)) {
                    flags.push({
                        type: 'DUPLICATE_UPLOAD',
                        severity: 'moderate',
                        message: `Duplicate file detected: ${upload.file}`,
                        evidence: { duplicate: hashes.get(hash), current: upload.file }
                    });
                } else {
                    hashes.set(hash, upload.file);
                }
            });
        }

        // Check 3: Suspicious fee change
        if (schoolData.feeHistory && schoolData.feeHistory.length > 1) {
            const recent = schoolData.feeHistory.slice(-2);
            const changePercent = ((recent[1].amount - recent[0].amount) / recent[0].amount) * 100;

            if (changePercent > 50) {
                flags.push({
                    type: 'SUSPICIOUS_FEE_CHANGE',
                    severity: 'moderate',
                    message: `Unusual fee increase of ${changePercent.toFixed(1)}%`,
                    evidence: { previousFee: recent[0].amount, newFee: recent[1].amount }
                });
            }
        }

        // Check 4: Empty or minimal data
        if (!schoolData.location || !schoolData.contacts || !schoolData.fees) {
            flags.push({
                type: 'INCOMPLETE_PROFILE',
                severity: 'mild',
                message: 'School profile is incomplete',
                evidence: { hasLocation: !!schoolData.location, hasContacts: !!schoolData.contacts, hasFees: !!schoolData.fees }
            });
        }

        // Check 5: Contradictory information
        if (schoolData.academicRating > 4.5 && (!schoolData.uploads || schoolData.uploads.length < 2)) {
            flags.push({
                type: 'CONTRADICTORY_DATA',
                severity: 'moderate',
                message: 'Claims high ratings but provides minimal documentation',
                evidence: { ratedHigh: schoolData.academicRating, uploadsCount: schoolData.uploads?.length || 0 }
            });
        }

        // Calculate recommended severity
        let recommendedSeverity = 'mild';
        if (flags.some(f => f.severity === 'severe')) recommendedSeverity = 'severe';
        else if (flags.some(f => f.severity === 'moderate')) recommendedSeverity = 'moderate';
        if (flags.length > 3) recommendedSeverity = 'critical';

        return {
            flagCount: flags.length,
            flags,
            recommendedSeverity,
            shouldPenalize: flags.length > 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Simple file hash (in production: use MD5/SHA256)
     */
    static hashFile(fileName) {
        return require('crypto')
            .createHash('md5')
            .update(fileName)
            .digest('hex');
    }

    /**
     * Apply penalty to school
     */
    static applyPenalty(schoolId, severity, reason) {
        try {
            const penaltyData = this.PENALTIES[severity] || this.PENALTIES.moderate;

            const penalty = {
                id: `PEN-${Date.now()}`,
                schoolId,
                severity,
                reason,
                feeIncrease: penaltyData.factor,
                ratingReduction: penaltyData.starReduction,
                appliedDate: new Date().toISOString(),
                expiresDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                status: 'active'
            };

            // Store penalty
            const penaltiesPath = path.join(__dirname, '../../data/penalties.json');
            let penalties = [];

            if (fs.existsSync(penaltiesPath)) {
                penalties = JSON.parse(fs.readFileSync(penaltiesPath, 'utf8'));
            }

            penalties.push(penalty);
            fs.writeFileSync(penaltiesPath, JSON.stringify(penalties, null, 2), 'utf8');

            // Log penalty
            this.logPenalty(penalty);

            return {
                success: true,
                penaltyId: penalty.id,
                details: penalty
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove penalty (appeal successful)
     */
    static removePenalty(penaltyId, appealReason) {
        try {
            const penaltiesPath = path.join(__dirname, '../../data/penalties.json');
            
            if (!fs.existsSync(penaltiesPath)) {
                return { success: false, error: 'No penalties found' };
            }

            let penalties = JSON.parse(fs.readFileSync(penaltiesPath, 'utf8'));
            const index = penalties.findIndex(p => p.id === penaltyId);

            if (index === -1) {
                return { success: false, error: 'Penalty not found' };
            }

            const penalty = penalties[index];
            penalty.status = 'appealed';
            penalty.appealReason = appealReason;
            penalty.appealDate = new Date().toISOString();

            fs.writeFileSync(penaltiesPath, JSON.stringify(penalties, null, 2), 'utf8');

            return {
                success: true,
                penaltyId,
                newStatus: 'appealed'
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get active penalties for school
     */
    static getActivePenalties(schoolId) {
        try {
            const penaltiesPath = path.join(__dirname, '../../data/penalties.json');
            
            if (!fs.existsSync(penaltiesPath)) {
                return { success: true, penalties: [] };
            }

            const penalties = JSON.parse(fs.readFileSync(penaltiesPath, 'utf8'));
            const activePenalties = penalties.filter(p => 
                p.schoolId === schoolId && 
                p.status === 'active' &&
                new Date(p.expiresDate) > new Date()
            );

            // Calculate total fee increase
            const totalFeeIncrease = activePenalties.reduce((sum, p) => sum + p.feeIncrease, 0);

            return {
                success: true,
                count: activePenalties.length,
                penalties: activePenalties,
                totalFeeIncrease,
                costToSchool: `+${(totalFeeIncrease * 100).toFixed(0)}% fee increase`
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Log penalty enforcement
     */
    static logPenalty(penaltyData) {
        try {
            const logsDir = path.join(__dirname, '../../logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            const logPath = path.join(logsDir, 'penalties.log');
            const logEntry = {
                penaltyId: penaltyData.id,
                schoolId: penaltyData.schoolId,
                severity: penaltyData.severity,
                reason: penaltyData.reason,
                feeIncrease: `+${(penaltyData.feeIncrease * 100).toFixed(0)}%`,
                ratingReduction: `-${penaltyData.ratingReduction} stars`,
                appliedDate: penaltyData.appliedDate,
                expiresDate: penaltyData.expiresDate,
                timestamp: new Date().toISOString()
            };

            fs.appendFileSync(
                logPath,
                JSON.stringify(logEntry) + '\n',
                'utf8'
            );

            return { success: true };
        } catch (error) {
            console.error('Penalty log error:', error);
        }
    }

    /**
     * Penalty statistics
     */
    static getPenaltyStats() {
        try {
            const penaltiesPath = path.join(__dirname, '../../data/penalties.json');
            
            if (!fs.existsSync(penaltiesPath)) {
                return {
                    totalPenalties: 0,
                    activePenalties: 0,
                    bySeverity: {}
                };
            }

            const penalties = JSON.parse(fs.readFileSync(penaltiesPath, 'utf8'));
            const now = new Date();

            const stats = {
                totalPenalties: penalties.length,
                activePenalties: penalties.filter(p => 
                    p.status === 'active' && 
                    new Date(p.expiresDate) > now
                ).length,
                bySeverity: {},
                affectedSchools: new Set(penalties.map(p => p.schoolId)).size
            };

            Object.keys(this.PENALTIES).forEach(severity => {
                stats.bySeverity[severity] = penalties.filter(p => p.severity === severity).length;
            });

            return stats;

        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = PenaltyService;
