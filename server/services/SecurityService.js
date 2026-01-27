/**
 * KSFP Security Service
 * Auto-assess school security (fence, guards, CCTV, incident history)
 * Risk-based scoring with admin verification
 */

const fs = require('fs');
const path = require('path');

class SecurityService {
    /**
     * Security risk zones by county
     * Government classification for high-risk areas
     */
    static RISK_ZONES = {
        'HIGH': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
        'MEDIUM': ['Kiambu', 'Machakos', 'Kajiado', 'Narok', 'Uasin Gishu', 'Kakamega'],
        'LOW': ['Muranga', 'Nyeri', 'Kirinyaga', 'Embu', 'Meru', 'Tharaka Nithi']
        // ASAL zones typically LOW but with different risks (wild animals, tribal conflicts)
    };

    /**
     * Calculate security score based on indicators
     * @param {Object} indicators - {has_fence, has_guards, has_cctv, incident_history, county}
     * @returns {Object} {security_score, security_level, risk_zone, breakdown}
     */
    static calculateSecurityScore(indicators) {
        let score = 50; // Base score

        // Get risk zone
        const riskZone = this.getRiskZone(indicators.county);
        const riskAdjustment = this.getRiskZoneAdjustment(riskZone);
        score += riskAdjustment;

        const breakdown = {
            base_score: 50,
            risk_zone_adjustment: riskAdjustment
        };

        // 1. PHYSICAL BARRIER (Fence)
        const fenceScore = indicators.has_fence ? 15 : -10;
        score += fenceScore;
        breakdown.fence_score = fenceScore;

        // 2. HUMAN SECURITY (Guards/Security staff)
        const guardsScore = indicators.has_guards ? 20 : -15;
        score += guardsScore;
        breakdown.guards_score = guardsScore;

        // 3. SURVEILLANCE (CCTV)
        const cctvScore = indicators.has_cctv ? 10 : 0;
        score += cctvScore;
        breakdown.cctv_score = cctvScore;

        // 4. HISTORICAL INCIDENTS (Major negative impact)
        let incidentScore = 0;
        if (indicators.incident_history && indicators.incident_history.length > 0) {
            // Number and severity of incidents
            const recentIncidents = indicators.incident_history.filter(i => {
                const daysSince = (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24);
                return daysSince < 365; // Last year
            });

            if (recentIncidents.length > 0) {
                incidentScore = -30 * Math.min(recentIncidents.length, 3); // Max -90
                score += incidentScore;
            }
        }
        breakdown.incident_score = incidentScore;

        // 5. CRITICAL GAPS (No guards in high-risk zone)
        if (riskZone === 'HIGH' && !indicators.has_guards) {
            score -= 20;
            breakdown.critical_gap_penalty = -20;
        }

        // Normalize to 0-100
        score = Math.max(0, Math.min(100, score));

        // Determine security level
        const securityLevel = this.classifySecurityLevel(score);

        return {
            security_score: Math.round(score),
            security_level: securityLevel,
            risk_zone: riskZone,
            breakdown: breakdown,
            calculated_at: new Date().toISOString()
        };
    }

    /**
     * Determine risk zone from county
     * @param {string} county
     * @returns {string} 'HIGH' | 'MEDIUM' | 'LOW'
     */
    static getRiskZone(county) {
        if (this.RISK_ZONES.HIGH.includes(county)) return 'HIGH';
        if (this.RISK_ZONES.MEDIUM.includes(county)) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Get score adjustment based on risk zone
     * @param {string} riskZone
     * @returns {number} Score adjustment
     */
    static getRiskZoneAdjustment(riskZone) {
        const adjustments = {
            'HIGH': -15,    // High-risk zone = harder to achieve high security
            'MEDIUM': -5,   // Medium-risk = slight adjustment
            'LOW': 5        // Low-risk = inherently safer
        };

        return adjustments[riskZone] || 0;
    }

    /**
     * Classify security level from score
     * @param {number} score - Security score (0-100)
     * @returns {string} 'HIGH' | 'MEDIUM' | 'LOW'
     */
    static classifySecurityLevel(score) {
        if (score >= 70) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Get security description for parents
     * @param {string} securityLevel
     * @param {string} riskZone
     * @returns {string}
     */
    static getSecurityDescription(securityLevel, riskZone) {
        const baseDesc = {
            'HIGH': 'Strong security measures in place',
            'MEDIUM': 'Adequate security with room for improvement',
            'LOW': 'Minimal security infrastructure'
        };

        const riskNote = {
            'HIGH': ' (Note: High-risk area)',
            'MEDIUM': '',
            'LOW': ' (Low-risk area)'
        };

        return baseDesc[securityLevel] + riskNote[riskZone];
    }

    /**
     * Get security recommendations
     * @param {Object} securityData - {has_fence, has_guards, has_cctv, security_score, risk_zone}
     * @returns {Array} Recommendations for improvement
     */
    static getSecurityRecommendations(securityData) {
        const recommendations = [];

        if (!securityData.has_fence) {
            recommendations.push({
                priority: 'HIGH',
                item: 'Install perimeter fence',
                impact: 'Would improve security score by +15'
            });
        }

        if (!securityData.has_guards && securityData.risk_zone === 'HIGH') {
            recommendations.push({
                priority: 'CRITICAL',
                item: 'Hire security guards',
                impact: 'Would improve security score by +35 (guards +20, critical gap +15)'
            });
        }

        if (!securityData.has_guards && securityData.risk_zone !== 'HIGH') {
            recommendations.push({
                priority: 'HIGH',
                item: 'Consider hiring security personnel',
                impact: 'Would improve security score by +20'
            });
        }

        if (!securityData.has_cctv) {
            recommendations.push({
                priority: 'MEDIUM',
                item: 'Install CCTV camera system',
                impact: 'Would improve security score by +10'
            });
        }

        return recommendations;
    }

    /**
     * Validate security requirements for high-risk areas
     * @param {Object} schoolData - {county, has_guards, has_fence}
     * @returns {Object} {compliant, requirements}
     */
    static validateHighRiskCompliance(schoolData) {
        const riskZone = this.getRiskZone(schoolData.county);
        const requirements = [];
        let compliant = true;

        if (riskZone === 'HIGH') {
            // Guards are mandatory in high-risk areas
            if (!schoolData.has_guards) {
                requirements.push('Guards required for high-risk area');
                compliant = false;
            }

            // Fence is strongly recommended
            if (!schoolData.has_fence) {
                requirements.push('Perimeter fence recommended for high-risk area');
            }
        }

        return {
            compliant: compliant,
            risk_zone: riskZone,
            requirements: requirements
        };
    }

    /**
     * Log security assessment
     * @param {string} schoolId
     * @param {Object} securityData
     */
    static logSecurityAssessment(schoolId, securityData) {
        try {
            const logPath = path.join(__dirname, '../../logs/security.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...securityData,
                event: 'SECURITY_ASSESSED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Security logging error:', error);
        }
    }

    /**
     * Record security incident (admin only)
     * @param {string} schoolId
     * @param {Object} incidentData - {date, type, description, severity}
     * @returns {Object} Incident record
     */
    static recordIncident(schoolId, incidentData) {
        const incident = {
            id: `inc_${Date.now()}`,
            school_id: schoolId,
            date: incidentData.date || new Date().toISOString(),
            type: incidentData.type, // theft, injury, trespassing, etc.
            description: incidentData.description,
            severity: incidentData.severity, // LOW | MEDIUM | HIGH
            reported_at: new Date().toISOString(),
            admin_verified: false
        };

        // Log incident
        this.logSecurityAssessment(schoolId, {
            ...incident,
            event: 'SECURITY_INCIDENT_REPORTED'
        });

        return incident;
    }

    /**
     * Verify security claim (admin audit)
     * @param {string} schoolId
     * @param {Object} claim - {has_fence, has_guards, has_cctv}
     * @param {Object} verification - {verified, notes, verifier_id}
     * @returns {Object}
     */
    static verifySecurityClaim(schoolId, claim, verification) {
        const record = {
            school_id: schoolId,
            claim: claim,
            verification: {
                ...verification,
                verified_at: new Date().toISOString(),
                status: verification.verified ? 'VERIFIED' : 'NEEDS_CORRECTION'
            }
        };

        this.logSecurityAssessment(schoolId, {
            ...record,
            event: 'SECURITY_CLAIM_VERIFIED'
        });

        return record;
    }

    /**
     * Get security analytics for dashboard
     * @param {Array} schools - Schools with security data
     * @returns {Object} Analytics summary
     */
    static getSecurityAnalytics(schools) {
        const stats = {
            total_schools: schools.length,
            with_fence: 0,
            with_guards: 0,
            with_cctv: 0,
            avg_security_score: 0,
            security_levels: { HIGH: 0, MEDIUM: 0, LOW: 0 },
            risk_zones: { HIGH: 0, MEDIUM: 0, LOW: 0 }
        };

        let totalScore = 0;

        schools.forEach(school => {
            if (school.has_fence) stats.with_fence++;
            if (school.has_guards) stats.with_guards++;
            if (school.has_cctv) stats.with_cctv++;
            
            totalScore += school.security_score || 50;
            stats.security_levels[school.security_level]++;
            stats.risk_zones[school.risk_zone]++;
        });

        stats.avg_security_score = Math.round(totalScore / schools.length);
        stats.fence_coverage = Math.round((stats.with_fence / schools.length) * 100);
        stats.guards_coverage = Math.round((stats.with_guards / schools.length) * 100);
        stats.cctv_coverage = Math.round((stats.with_cctv / schools.length) * 100);

        return stats;
    }
}

module.exports = SecurityService;
