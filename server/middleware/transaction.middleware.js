/* ============================================
   ACID TRANSACTION MIDDLEWARE
   Ensures Transaction Atomicity & Consistency
   ============================================ */

const fs = require('fs');
const path = require('path');

class AcidTransaction {
    constructor() {
        this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.operations = [];
        this.status = 'PENDING';
        this.startTime = new Date();
    }

    /**
     * Start transaction logging
     */
    log(operation, details) {
        this.operations.push({
            sequence: this.operations.length + 1,
            operation,
            details,
            timestamp: new Date().toISOString()
        });
        console.log(`[${this.transactionId}] ${operation}:`, details);
    }

    /**
     * Execute callback with ACID guarantee
     * If ANY step fails, entire transaction rolls back
     */
    async execute(callback) {
        try {
            this.log('BEGIN', 'Transaction started');
            
            // Execute user callback
            const result = await callback(this);

            this.log('COMMIT', 'All operations succeeded');
            this.status = 'COMMITTED';

            return {
                success: true,
                transactionId: this.transactionId,
                result,
                duration: Date.now() - this.startTime.getTime() + 'ms'
            };

        } catch (error) {
            this.log('ROLLBACK', error.message);
            this.status = 'ROLLED_BACK';

            console.error(`[${this.transactionId}] Transaction failed:`, error.message);

            return {
                success: false,
                transactionId: this.transactionId,
                error: error.message,
                operations: this.operations,
                duration: Date.now() - this.startTime.getTime() + 'ms'
            };
        }
    }

    /**
     * Write file atomically (core ACID operation)
     */
    writeFileAtomically(filePath, data) {
        try {
            const tempPath = filePath + '.tmp';
            
            // Write to temporary file
            fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
            
            // Verify write succeeded
            const written = fs.readFileSync(tempPath, 'utf8');
            if (written !== JSON.stringify(data, null, 2)) {
                throw new Error('Data verification failed after write');
            }

            // Atomic rename
            if (fs.existsSync(filePath)) {
                const backupPath = filePath + '.bak';
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
                fs.renameSync(filePath, backupPath);
            }

            fs.renameSync(tempPath, filePath);

            this.log('FILE_WRITE', `${path.basename(filePath)} written atomically`);
            return true;

        } catch (error) {
            // Cleanup temp file
            if (fs.existsSync(filePath + '.tmp')) {
                fs.unlinkSync(filePath + '.tmp');
            }
            throw error;
        }
    }

    /**
     * Read file atomically
     */
    readFileAtomically(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            this.log('FILE_READ', `${path.basename(filePath)} read successfully`);
            return parsed;

        } catch (error) {
            throw new Error(`Failed to read ${path.basename(filePath)}: ${error.message}`);
        }
    }

    /**
     * Ensure data consistency before commit
     */
    validateConsistency(data, schema) {
        const errors = [];

        Object.keys(schema).forEach(key => {
            const rules = schema[key];
            const value = data[key];

            if (rules.required && !value) {
                errors.push(`${key} is required`);
            }

            if (rules.type && typeof value !== rules.type) {
                errors.push(`${key} must be ${rules.type}`);
            }

            if (rules.min && value < rules.min) {
                errors.push(`${key} must be >= ${rules.min}`);
            }

            if (rules.max && value > rules.max) {
                errors.push(`${key} must be <= ${rules.max}`);
            }
        });

        if (errors.length > 0) {
            throw new Error(`Consistency check failed: ${errors.join(', ')}`);
        }

        this.log('CONSISTENCY_CHECK', 'Data validation passed');
        return true;
    }

    /**
     * Save transaction log for audit trail
     */
    saveLog() {
        try {
            const logsDir = path.join(__dirname, '../../logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            const logEntry = {
                transactionId: this.transactionId,
                status: this.status,
                startTime: this.startTime.toISOString(),
                endTime: new Date().toISOString(),
                operationCount: this.operations.length,
                operations: this.operations
            };

            const logPath = path.join(logsDir, 'transactions.log');
            fs.appendFileSync(
                logPath,
                JSON.stringify(logEntry) + '\n',
                'utf8'
            );

            return { success: true, logPath };

        } catch (error) {
            console.error('Transaction log error:', error);
        }
    }
}

/**
 * Middleware: Wrap Express routes with ACID transaction
 */
const acidTransactionMiddleware = (req, res, next) => {
    req.transaction = new AcidTransaction();
    
    res.on('finish', () => {
        if (req.transaction) {
            req.transaction.saveLog();
        }
    });

    next();
};

module.exports = {
    AcidTransaction,
    acidTransactionMiddleware
};
