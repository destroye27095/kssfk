/* ============================================
   KSSFK - Admin Panel Script
   ============================================ */

let adminData = {
    schools: [],
    uploads: [],
    payments: [],
    penalties: []
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeAdminPanel();
});

/**
 * Initialize admin panel
 */
async function initializeAdminPanel() {
    // Load all data
    adminData.schools = await loadSchools();
    adminData.uploads = await loadUploads();
    adminData.payments = await loadPayments();
    adminData.penalties = await loadPenalties();

    // Render header and footer
    renderAdminHeader();
    renderFooter();

    // Load initial tab (schools)
    showTab('schools');
}

/**
 * Render admin header
 */
function renderAdminHeader() {
    const headerHTML = `
        <header>
            <div class="container">
                <h1>KSSFK Admin Panel</h1>
                <p>Manage Schools, Uploads, Payments & Compliance</p>
            </div>
        </header>
    `;
    document.getElementById('header-container').innerHTML = headerHTML;
}

/**
 * Render footer
 */
function renderFooter() {
    const footerHTML = `
        <footer>
            <div class="container">
                <p>&copy; 2026 Kenya School Fee Platform Admin</p>
            </div>
        </footer>
    `;
    document.getElementById('footer-container').innerHTML = footerHTML;
}

/**
 * Show specific tab
 */
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');

    // Remove active class from links
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Add active class to clicked link
    event.target.classList.add('active');

    // Load tab content
    switch (tabName) {
        case 'schools':
            renderSchoolsList();
            break;
        case 'uploads':
            renderUploadsApproval();
            break;
        case 'payments':
            renderPaymentsTable();
            break;
        case 'penalties':
            renderPenaltiesList();
            break;
        case 'analytics':
            renderAnalytics();
            break;
    }

    logActivity('admin_tab_view', { tabName });
}

/**
 * Render schools management list
 */
function renderSchoolsList() {
    const schoolsHTML = adminData.schools.map(school => `
        <div class="school-row">
            <div class="school-info">
                <h5>${school.name}</h5>
                <p><strong>Level:</strong> ${school.grade} | <strong>Type:</strong> ${school.type}</p>
                <p><strong>Contact:</strong> ${school.phone} | ${school.email}</p>
                <p><strong>Annual Fee:</strong> KES ${school.annualFee}</p>
            </div>
            <div class="school-actions">
                <button class="btn btn-primary btn-sm" onclick="editSchool('${school.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSchool('${school.id}')">Delete</button>
                <button class="btn btn-warning btn-sm" onclick="viewSchoolUploads('${school.id}')">Uploads</button>
            </div>
        </div>
    `).join('');

    document.getElementById('school-list-container').innerHTML = schoolsHTML || '<p>No schools found</p>';
}

/**
 * Add new school
 */
function addSchool() {
    const schoolForm = `
        <div class="form-group">
            <label>School Name</label>
            <input type="text" class="form-control" id="schoolName" placeholder="Enter school name">
        </div>
        <div class="form-group">
            <label>Grade Level</label>
            <select class="form-control" id="schoolGrade">
                <option>ECDE</option>
                <option>Primary</option>
                <option>Secondary</option>
                <option>University</option>
            </select>
        </div>
        <div class="form-group">
            <label>School Type</label>
            <select class="form-control" id="schoolType">
                <option>public</option>
                <option>private</option>
            </select>
        </div>
        <div class="form-group">
            <label>Annual Fee (KES)</label>
            <input type="number" class="form-control" id="schoolAnnualFee" placeholder="Enter annual fee">
        </div>
        <button class="btn btn-success" onclick="submitNewSchool()">Save School</button>
    `;

    const container = document.getElementById('school-list-container');
    container.innerHTML = `<div class="form-section">${schoolForm}</div>` + container.innerHTML;
}

/**
 * Edit school
 */
function editSchool(schoolId) {
    const school = adminData.schools.find(s => s.id === schoolId);
    if (!school) return;

    alert('Edit functionality for: ' + school.name);
    logActivity('edit_school', { schoolId });
}

/**
 * Delete school
 */
function deleteSchool(schoolId) {
    const school = adminData.schools.find(s => s.id === schoolId);
    if (!school) return;

    if (confirm('Are you sure you want to delete ' + school.name + '?')) {
        adminData.schools = adminData.schools.filter(s => s.id !== schoolId);
        renderSchoolsList();
        logActivity('delete_school', { schoolId, schoolName: school.name });
        alert('School deleted successfully');
    }
}

/**
 * View school uploads
 */
function viewSchoolUploads(schoolId) {
    const school = adminData.schools.find(s => s.id === schoolId);
    const uploads = adminData.uploads.filter(u => u.schoolId === schoolId);

    const uploadsHTML = uploads.map(upload => `
        <div class="upload-card ${upload.status}">
            <div class="upload-header">
                <h5>${upload.title}</h5>
                <span class="status-badge status-${upload.status}">${upload.status}</span>
            </div>
            <p><strong>Type:</strong> ${upload.type}</p>
            <p><strong>Uploaded:</strong> ${formatDate(upload.uploadedDate)}</p>
            <p>${upload.description}</p>
            <button class="btn btn-success btn-sm" onclick="approveUpload('${upload.id}')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectUpload('${upload.id}')">Reject</button>
        </div>
    `).join('');

    alert(`Uploads for ${school.name}\n${uploads.length} uploads found`);
}

/**
 * Render uploads approval section
 */
function renderUploadsApproval() {
    const pendingUploads = adminData.uploads.filter(u => u.status === 'pending');

    const uploadsHTML = pendingUploads.map(upload => `
        <div class="upload-card pending">
            <div class="upload-header">
                <h5>${upload.title}</h5>
                <span class="status-badge status-pending">Pending</span>
            </div>
            <p><strong>School:</strong> ${upload.schoolName}</p>
            <p><strong>Type:</strong> ${upload.type}</p>
            <p><strong>Uploaded:</strong> ${formatDate(upload.uploadedDate)}</p>
            <p>${upload.description}</p>
            <button class="btn btn-success btn-sm" onclick="approveUpload('${upload.id}')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectUpload('${upload.id}')">Reject</button>
        </div>
    `).join('');

    document.getElementById('uploads-approval-container').innerHTML = uploadsHTML || '<p>No pending uploads</p>';
}

/**
 * Approve upload
 */
function approveUpload(uploadId) {
    const upload = adminData.uploads.find(u => u.id === uploadId);
    if (!upload) return;

    upload.status = 'approved';
    upload.approvedDate = new Date().toISOString();

    logActivity('upload_approved', { uploadId, schoolId: upload.schoolId });
    alert('Upload approved: ' + upload.title);
    renderUploadsApproval();
}

/**
 * Reject upload
 */
function rejectUpload(uploadId) {
    const upload = adminData.uploads.find(u => u.id === uploadId);
    if (!upload) return;

    upload.status = 'rejected';
    upload.rejectedDate = new Date().toISOString();

    logActivity('upload_rejected', { uploadId, schoolId: upload.schoolId });
    alert('Upload rejected: ' + upload.title);
    renderUploadsApproval();
}

/**
 * Render payments table
 */
function renderPaymentsTable() {
    const paymentsHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Payment ID</th>
                    <th>School</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${adminData.payments.map(payment => `
                    <tr>
                        <td>${payment.id}</td>
                        <td>${payment.schoolName}</td>
                        <td>KES ${payment.amount}</td>
                        <td>${formatDate(payment.paymentDate)}</td>
                        <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="viewPaymentDetails('${payment.id}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('payments-table-container').innerHTML = paymentsHTML;
}

/**
 * View payment details
 */
function viewPaymentDetails(paymentId) {
    const payment = adminData.payments.find(p => p.id === paymentId);
    if (!payment) return;

    alert('Payment Details:\n' + JSON.stringify(payment, null, 2));
}

/**
 * Render penalties list
 */
function renderPenaltiesList() {
    const penaltiesHTML = adminData.penalties.map(penalty => `
        <div class="penalty-item">
            <h5>${penalty.schoolName}</h5>
            <p class="penalty-reason"><strong>Reason:</strong> ${penalty.reason}</p>
            <p class="penalty-amount">Penalty: ${formatCurrency(penalty.amount)}</p>
            <p><strong>Applied:</strong> ${formatDate(penalty.appliedDate)}</p>
            <button class="btn btn-danger btn-sm" onclick="enforceCompliancePenalty('${penalty.id}')">Enforce</button>
        </div>
    `).join('');

    document.getElementById('penalties-list-container').innerHTML = penaltiesHTML || '<p>No penalties on record</p>';
}

/**
 * Enforce compliance penalty
 */
function enforceCompliancePenalty(penaltyId) {
    const penalty = adminData.penalties.find(p => p.id === penaltyId);
    if (!penalty) return;

    const school = adminData.schools.find(s => s.id === penalty.schoolId);
    if (school) {
        school.annualFee += penalty.amount;
        school.penaltyApplied = true;
        logActivity('penalty_enforced', { penaltyId, schoolId: penalty.schoolId });
        alert('Penalty enforced on ' + school.name);
    }
}

/**
 * Render analytics
 */
function renderAnalytics() {
    const analyticsHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h4>Total Schools</h4>
                <div class="value">${adminData.schools.length}</div>
            </div>
            <div class="analytics-card">
                <h4>Pending Uploads</h4>
                <div class="value">${adminData.uploads.filter(u => u.status === 'pending').length}</div>
            </div>
            <div class="analytics-card">
                <h4>Total Payments</h4>
                <div class="value">KES ${adminData.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
            </div>
            <div class="analytics-card">
                <h4>Active Penalties</h4>
                <div class="value">${adminData.penalties.length}</div>
            </div>
        </div>
    `;

    document.getElementById('admin-analytics-container').innerHTML = analyticsHTML;
}

/**
 * Load uploads data
 */
async function loadUploads() {
    try {
        const response = await fetch('data/uploads.json');
        if (!response.ok) throw new Error('Failed to load uploads');
        return await response.json();
    } catch (error) {
        console.error('Error loading uploads:', error);
        return [];
    }
}

/**
 * Load penalties data
 */
async function loadPenalties() {
    try {
        const response = await fetch('data/penalties.json');
        if (!response.ok) throw new Error('Failed to load penalties');
        return await response.json();
    } catch (error) {
        console.error('Error loading penalties:', error);
        return [];
    }
}

/**
 * Log activity for audit trail
 */
function logActivity(activityType, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: activityType,
        details: details,
        adminUser: localStorage.getItem('adminUser') || 'admin'
    };

    const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('adminLogs', JSON.stringify(logs));
}
