/* ============================================
   IMMUTABLE LOGGING MIDDLEWARE
   Court-Ready Audit Trail
   ============================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ImmutableLogger {
    /**
     * Log with tamper-detection (hash chain)
     */
    static logEvent(category, action, details = {}) {
        try {
            const logsDir = path.join(__dirname, '../../logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            const logFile = path.join(logsDir, `${category}.log`);
            
            // Get previous hash for chain
            let previousHash = 'GENESIS';
            if (fs.existsSync(logFile)) {
                const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
                if (lines.length > 0) {
                    try {
                        const lastEntry = JSON.parse(lines[lines.length - 1]);
                        previousHash = lastEntry.hash;
                    } catch (e) {
                        // Invalid JSON, start fresh
                    }
                }
            }

            // Create immutable entry
            const entry = {
                timestamp: new Date().toISOString(),
                isoDate: new Date().toISOString().split('T')[0],
                unixTime: Date.now(),
                action,
                details,
                previousHash,
                sequenceId: this.getNextSequenceId(logFile)
            };

            // Calculate hash for this entry (tamper-proof)
            entry.hash = this.calculateHash(entry);

            // Append to log (immutable = append-only)
            fs.appendFileSync(
                logFile,
                JSON.stringify(entry) + '\n',
                'utf8'
            );

            // Update index
            this.updateLogIndex(category);

            return { success: true, entry };

        } catch (error) {
            console.error('Logging error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate SHA256 hash (tamper-detection)
     */
    static calculateHash(entry) {
        const dataToHash = JSON.stringify({
            timestamp: entry.timestamp,
            action: entry.action,
            details: entry.details,
            previousHash: entry.previousHash,
            sequenceId: entry.sequenceId
        });

        return crypto
            .createHash('sha256')
            .update(dataToHash)
            .digest('hex');
    }

    /**
     * Get next sequence ID
     */
    static getNextSequenceId(logFile) {
        try {
            if (!fs.existsSync(logFile)) return 1;

            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
            if (lines.length === 0) return 1;

            try {
                const lastEntry = JSON.parse(lines[lines.length - 1]);
                return (lastEntry.sequenceId || 0) + 1;
            } catch (e) {
                return lines.length + 1;
            }
        } catch (error) {
            return 1;
        }
    }

    /**
     * Verify log integrity (chain verification)
     */
    static verifyLogIntegrity(category) {
        try {
            const logFile = path.join(__dirname, '../../logs', `${category}.log`);
            
            if (!fs.existsSync(logFile)) {
                return { valid: true, message: 'Log file does not exist', entriesChecked: 0 };
            }

            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
            let previousHash = 'GENESIS';
            let entriesChecked = 0;
            const errors = [];

            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);

                    // Check 1: Hash chain integrity
                    if (entry.previousHash !== previousHash) {
                        errors.push(`Entry ${entry.sequenceId}: Hash chain broken`);
                    }

                    // Check 2: Recalculate hash
                    const storedHash = entry.hash;
                    delete entry.hash;
                    const recalculatedHash = this.calculateHash(entry);

                    if (storedHash !== recalculatedHash) {
                        errors.push(`Entry ${entry.sequenceId}: Data tampered (hash mismatch)`);
                    }

                    previousHash = storedHash;
                    entriesChecked++;

                } catch (e) {
                    errors.push(`Invalid JSON at line ${entriesChecked + 1}`);
                }
            }

            return {
                valid: errors.length === 0,
                entriesChecked,
                errors,
                integrity: errors.length === 0 ? 'VERIFIED' : 'COMPROMISED'
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Update log index (for quick searches)
     */
    static updateLogIndex(category) {
        try {
            const logsDir = path.join(__dirname, '../../logs');
            const indexPath = path.join(logsDir, 'index.json');

            let index = {};
            if (fs.existsSync(indexPath)) {
                index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
            }

            if (!index[category]) {
                index[category] = { entries: 0, lastUpdated: null };
            }

            const logFile = path.join(logsDir, `${category}.log`);
            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');

            index[category] = {
                entries: lines.length,
                lastUpdated: new Date().toISOString(),
                firstEntry: lines.length > 0 ? 
                    new Date(JSON.parse(lines[0]).timestamp).toISOString() : null,
                lastEntry: lines.length > 0 ? 
                    new Date(JSON.parse(lines[lines.length - 1]).timestamp).toISOString() : null
            };

            fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

        } catch (error) {
            console.error('Index update error:', error);
        }
    }

    /**
     * Get log entries (read-only)
     */
    static readLogEntries(category, limit = 100) {
        try {
            const logFile = path.join(__dirname, '../../logs', `${category}.log`);
            
            if (!fs.existsSync(logFile)) {
                return { success: true, entries: [], total: 0 };
            }

            const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
            const entries = lines
                .slice(-limit)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(e => e !== null);

            return {
                success: true,
                entries,
                total: lines.length,
                displayed: entries.length
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Export log for audit/court
     */
    static exportLog(category, format = 'json') {
        try {
            const logFile = path.join(__dirname, '../../logs', `${category}.log`);
            
            if (!fs.existsSync(logFile)) {
                return { success: false, error: 'Log file not found' };
            }

            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.trim().split('\n');

            if (format === 'csv') {
                return this.exportAsCSV(lines, category);
            } else {
                return this.exportAsJSON(lines, category);
            }

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static exportAsJSON(lines, category) {
        const entries = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(e => e !== null);

        return {
            success: true,
            format: 'JSON',
            category,
            entries,
            exportedAt: new Date().toISOString(),
            integrityStatus: this.verifyLogIntegrity(category).integrity
        };
    }

    static exportAsCSV(lines, category) {
        const entries = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(e => e !== null);

        if (entries.length === 0) {
            return { success: true, format: 'CSV', data: '' };
        }

        // Create CSV header
        const headers = ['timestamp', 'action', 'sequenceId', 'hash'];
        let csv = headers.join(',') + '\n';

        // Add entries
        entries.forEach(entry => {
            csv += `"${entry.timestamp}","${entry.action}",${entry.sequenceId},"${entry.hash}"\n`;
        });

        return {
            success: true,
            format: 'CSV',
            category,
            data: csv,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Log all standard events
     */
    static logPayment(paymentData) {
        return this.logEvent('payments', 'PAYMENT_PROCESSED', paymentData);
    }

    static logReceipt(receiptData) {
        return this.logEvent('receipts', 'RECEIPT_GENERATED', receiptData);
    }

    static logRating(ratingData) {
        return this.logEvent('ratings', 'RATING_SUBMITTED', ratingData);
    }

    static logUpload(uploadData) {
        return this.logEvent('uploads', 'FILE_UPLOADED', uploadData);
    }

    static logVacancy(vacancyData) {
        return this.logEvent('vacancies', 'VACANCY_UPDATED', vacancyData);
    }

    static logAccess(accessData) {
        return this.logEvent('access', 'USER_ACCESS', accessData);
    }

    static logPenalty(penaltyData) {
        return this.logEvent('penalties', 'PENALTY_APPLIED', penaltyData);
    }
}

/**
 * Express Middleware
 */
const immutableLoggingMiddleware = (req, res, next) => {
    // Log access
    ImmutableLogger.logAccess({
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // Log response
    res.on('finish', () => {
        // Only log errors or specific actions
        if (res.statusCode >= 400) {
            ImmutableLogger.logEvent('errors', 'HTTP_ERROR', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode
            });
        }
    });

    next();
};

module.exports = {
    ImmutableLogger,
    immutableLoggingMiddleware
};
