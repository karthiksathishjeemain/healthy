const multer = require('multer');
const XLSX = require('xlsx');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const phiKeywords = [
    'dob', 'date of birth', 'address', 'phone', 'mobile', 'email',
    'ssn', 'social security', 'mrn', 'medical record', 'health plan',
    'license', 'account number', 'ip address', 'device id', 'biometric',
    'photo', 'facial', 'fingerprint', 'signature', 'first name', 'last name',
    'name'
];

function generateAnonymizedId(input, index) {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    const shortHash = hash.substring(0, 8);
    return `WID_${shortHash}`;
}

function generateUUID() {
    return uuidv4();
}

const anonymizeFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded. Please upload an Excel file.' 
            });
        }

        const walletAddress = req.body.walletAddress;
        const isPersonalData = !!walletAddress;

        console.log('Processing anonymization:', { 
            isPersonalData, 
            walletAddress: walletAddress ? `${walletAddress.substring(0, 6)}...` : 'N/A' 
        });

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const allIdentifiers = new Set();
        const sheetColumnRefs = {};

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) return;
            
            const headers = jsonData[0] || [];
            let patientIdCol = null;

            headers.forEach((header, index) => {
                if (header && typeof header === 'string') {
                    const headerLower = header.toLowerCase();
                    if (headerLower.includes('patient') && headerLower.includes('id')) {
                        patientIdCol = index;
                    }
                }
            });

            if (patientIdCol !== null) {
            
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[patientIdCol]) {
                        const patientId = String(row[patientIdCol]).toLowerCase().trim();
                        allIdentifiers.add(patientId);
                    }
                }
                sheetColumnRefs[sheetName] = { patientIdCol };
            } else {
             
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
                        const uuid = generateUUID();
                        allIdentifiers.add(uuid);
                    }
                }
                sheetColumnRefs[sheetName] = { useUUID: true };
            }
        });

        const sortedIdentifiers = Array.from(allIdentifiers).sort();
        const identifierToId = {};
        
        // Handle all 4 cases:
        // 1. Personal + Patient ID exists: Hash each patient ID individually
        // 2. Personal + No Patient ID: Use wallet address for all rows
        // 3. Institution + Patient ID exists: Hash each patient ID individually  
        // 4. Institution + No Patient ID: Use UUID for each row
        
        sortedIdentifiers.forEach((identifier, index) => {
            identifierToId[identifier] = generateAnonymizedId(identifier, index + 1);
        });

        const cleanedWorkbook = XLSX.utils.book_new();

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                XLSX.utils.book_append_sheet(cleanedWorkbook, worksheet, sheetName);
                return;
            }

            const headers = jsonData[0] || [];
            const cleanedData = jsonData.map(row => [...row]);

            if (sheetColumnRefs[sheetName]) {
                const sheetRefs = sheetColumnRefs[sheetName];

               
                const columnsToMask = [];
                headers.forEach((header, index) => {
                    if (header && typeof header === 'string') {
                        const headerLower = header.toLowerCase();
                        const isPatientIdColumn = index === sheetRefs.patientIdCol;
                        const isPhiColumn = phiKeywords.some(keyword => {
                            return headerLower.includes(keyword) || 
                                   headerLower.replace(/\s+/g, '').includes(keyword.replace(/\s+/g, ''));
                        });
                        
                        if (isPatientIdColumn || isPhiColumn) {
                            columnsToMask.push(index);
                        }
                    }
                });

                if (sheetRefs.useUUID) {
                    // Handle sheets without patient ID column
                    // Case 2: Personal + No Patient ID - Use wallet address
                    // Case 4: Institution + No Patient ID - Use UUID for each row
                    for (let i = 1; i < cleanedData.length; i++) {
                        const row = cleanedData[i];
                        if (row && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
                            let id;
                            if (isPersonalData && walletAddress) {
                                // Case 2: Personal data without Patient ID - use wallet address
                                id = generateAnonymizedId(walletAddress, 1);
                            } else {
                                // Case 4: Institution data without Patient ID - use UUID
                                const uuid = generateUUID();
                                id = generateAnonymizedId(uuid, i);
                            }
                            
                            columnsToMask.forEach(colIndex => {
                                if (row[colIndex] !== undefined) {
                                    row[colIndex] = id;
                                }
                            });
                        }
                    }
                } else {
                    // Handle sheets with patient ID column
                    // Case 1: Personal + Patient ID exists - Hash each patient ID individually
                    // Case 3: Institution + Patient ID exists - Hash each patient ID individually
                    for (let i = 1; i < cleanedData.length; i++) {
                        const row = cleanedData[i];
                        let id = null;

                        if (sheetRefs.patientIdCol !== undefined && row && row[sheetRefs.patientIdCol]) {
                            const patientId = String(row[sheetRefs.patientIdCol]).toLowerCase().trim();
                            id = identifierToId[patientId];
                        }

                        if (id) {
                            columnsToMask.forEach(colIndex => {
                                if (row[colIndex] !== undefined) {
                                    row[colIndex] = id;
                                }
                            });
                        }
                    }
                }
            }

            const newWorksheet = XLSX.utils.aoa_to_sheet(cleanedData);
            XLSX.utils.book_append_sheet(cleanedWorkbook, newWorksheet, sheetName);
        });

        const outputBuffer = XLSX.write(cleanedWorkbook, { 
            bookType: 'xlsx', 
            type: 'buffer' 
        });

        const timestamp = Date.now();
        const filename = `phi_anonymized_${timestamp}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', outputBuffer.length);

        res.send(outputBuffer);

    } catch (error) {
        console.error('Error processing file:', error);
        
        if (error.message.includes('Only Excel files')) {
            return res.status(400).json({ 
                error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls).' 
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error occurred while processing the file.' 
        });
    }
};

module.exports = {
    anonymizeFile,
    upload
};
