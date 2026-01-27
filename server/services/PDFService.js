/* ============================================
   PDF SERVICE - Receipt Generation
   Production-Grade PDF with KSFP Signature
   ============================================ */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    /**
     * Generate payment receipt as PDF
     * Footer: "Served by KSFP courtesy of the school looked in"
     */
    static generateReceipt(paymentData) {
        return new Promise((resolve, reject) => {
            try {
                // Create receipts directory if not exists
                const receiptsDir = path.join(__dirname, '../../storage/receipts');
                if (!fs.existsSync(receiptsDir)) {
                    fs.mkdirSync(receiptsDir, { recursive: true });
                }

                const receiptId = `KSFP-${new Date().getFullYear()}-${String(paymentData.transactionNumber).padStart(6, '0')}`;
                const fileName = `${receiptId}.pdf`;
                const filePath = path.join(receiptsDir, fileName);

                // Create PDF document
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    bufferPages: true
                });

                // Pipe to file
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // HEADER
                doc.fontSize(24)
                    .font('Helvetica-Bold')
                    .text('KSFP', { align: 'center' })
                    .fontSize(12)
                    .font('Helvetica')
                    .text('Kenya School Fee Platform', { align: 'center' });

                doc.moveTo(50, 100).lineTo(550, 100).stroke();

                // RECEIPT DETAILS
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .text('PAYMENT RECEIPT', { align: 'center' })
                    .moveDown(0.5);

                doc.font('Helvetica')
                    .fontSize(10);

                // Receipt metadata
                const startY = doc.y;
                doc.text(`Receipt No: ${receiptId}`, 60);
                doc.text(`Date & Time: ${new Date(paymentData.paymentDate).toLocaleString('en-KE')}`, 60);
                doc.text(`Transaction ID: ${paymentData.transactionId}`, 60);

                doc.moveDown(0.8);

                // PAYMENT DETAILS
                doc.font('Helvetica-Bold')
                    .fontSize(11)
                    .text('PAYMENT DETAILS', 60);

                doc.font('Helvetica')
                    .fontSize(10);

                doc.moveTo(60, doc.y).lineTo(550, doc.y).stroke();

                const detailsY = doc.y + 10;
                doc.text(`Parent Name: ${paymentData.parentName}`, 60);
                doc.text(`Parent Email: ${paymentData.parentEmail}`, 60);
                doc.text(`Parent Phone: ${paymentData.parentPhone}`, 60);

                doc.moveDown(0.5);
                doc.text(`School Name: ${paymentData.schoolName}`, 60);
                doc.text(`School Level: ${paymentData.schoolLevel}`, 60);
                doc.text(`School Location: ${paymentData.schoolLocation}`, 60);

                doc.moveDown(0.8);

                // AMOUNT TABLE
                doc.font('Helvetica-Bold')
                    .text('AMOUNT DETAILS', 60);

                doc.moveTo(60, doc.y).lineTo(550, doc.y).stroke();

                doc.font('Helvetica');
                doc.text(`Amount: KES ${paymentData.amount.toLocaleString()}`, 60);
                doc.text(`Purpose: ${paymentData.purpose || 'School Fee Review'}`, 60);
                doc.text(`Payment Method: ${paymentData.paymentMethod}`, 60);
                doc.text(`Status: ${paymentData.status}`, 60);

                doc.moveDown(1.2);

                // IMPORTANT DISCLAIMER
                doc.font('Helvetica-Bold')
                    .fontSize(9)
                    .text('IMPORTANT DISCLAIMER', 60);

                doc.font('Helvetica')
                    .fontSize(8);

                const disclaimerText = `This receipt confirms payment through the Kenya School Fee Platform (KSFP). KSFP does not guarantee admission. Schools are fully liable for uploaded information. Fake information detected will result in penalties as per platform policy.`;

                doc.text(disclaimerText, 60, doc.y, {
                    width: 450,
                    align: 'left'
                });

                doc.moveDown(1.5);

                // FOOTER SIGNATURE (MANDATORY)
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

                doc.fontSize(9)
                    .font('Helvetica-Italic')
                    .text('Served by KSFP', { align: 'center' })
                    .font('Helvetica')
                    .fontSize(8)
                    .text('Courtesy of the school looked in', { align: 'center' });

                doc.fontSize(7)
                    .text('System Generated – Valid Without Signature', { align: 'center' })
                    .text(`Generated: ${new Date().toISOString()}`, { align: 'center' });

                // Add QR code placeholder
                doc.moveDown(0.5);
                doc.fontSize(7)
                    .text(`Verify at: https://ksfp.ac.ke/verify/${receiptId}`, { align: 'center' });

                // Finalize PDF
                doc.end();

                stream.on('finish', () => {
                    resolve({
                        success: true,
                        receiptId,
                        filePath,
                        fileName,
                        generatedAt: new Date().toISOString()
                    });
                });

                stream.on('error', (err) => {
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Store receipt metadata in database
     */
    static storeReceiptMetadata(receiptData) {
        try {
            const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
            
            let allReceipts = [];
            if (fs.existsSync(metadataPath)) {
                allReceipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            }

            allReceipts.push({
                receiptId: receiptData.receiptId,
                transactionId: receiptData.transactionId,
                parentId: receiptData.parentId,
                schoolId: receiptData.schoolId,
                amount: receiptData.amount,
                filePath: receiptData.filePath,
                generatedAt: receiptData.generatedAt,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
            });

            fs.writeFileSync(metadataPath, JSON.stringify(allReceipts, null, 2), 'utf8');

            return { success: true, receiptsCount: allReceipts.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Retrieve receipt by ID
     */
    static getReceipt(receiptId) {
        try {
            const receiptsDir = path.join(__dirname, '../../storage/receipts');
            const filePath = path.join(receiptsDir, `${receiptId}.pdf`);

            if (!fs.existsSync(filePath)) {
                return { success: false, error: 'Receipt not found' };
            }

            return {
                success: true,
                filePath,
                fileName: `${receiptId}.pdf`,
                size: fs.statSync(filePath).size
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify receipt authenticity
     */
    static verifyReceipt(receiptId) {
        try {
            const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
            
            if (!fs.existsSync(metadataPath)) {
                return { valid: false, message: 'No receipts found' };
            }

            const receipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const receipt = receipts.find(r => r.receiptId === receiptId);

            if (!receipt) {
                return { valid: false, message: 'Receipt not found in system' };
            }

            // Check if expired
            if (new Date() > new Date(receipt.expiresAt)) {
                return { valid: false, message: 'Receipt has expired' };
            }

            return {
                valid: true,
                receipt,
                message: 'Receipt is valid'
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Delete old receipts (archive)
     */
    static archiveOldReceipts(daysOld = 365) {
        try {
            const receiptsDir = path.join(__dirname, '../../storage/receipts');
            const backupsDir = path.join(__dirname, '../../storage/backups');

            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir, { recursive: true });
            }

            const files = fs.readdirSync(receiptsDir).filter(f => f.endsWith('.pdf'));
            const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

            let archivedCount = 0;

            files.forEach(file => {
                const filePath = path.join(receiptsDir, file);
                const fileStats = fs.statSync(filePath);

                if (fileStats.mtimeMs < cutoffDate) {
                    const backupPath = path.join(backupsDir, file);
                    fs.copyFileSync(filePath, backupPath);
                    fs.unlinkSync(filePath);
                    archivedCount++;
                }
            });

            return {
                success: true,
                archivedCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = PDFService;
