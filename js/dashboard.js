/* ============================================
   KSSFK - School Dashboard Script
   ============================================ */

let schoolData = {
    info: {},
    uploads: [],
    vacancies: [],
    jobs: [],
    fees: []
};

let currentSchoolId = localStorage.getItem('currentSchoolId') || 'school-001';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
});

/**
 * Initialize school dashboard
 */
async function initializeDashboard() {
    // Load school data
    const schools = await loadSchools();
    schoolData.info = schools.find(s => s.id === currentSchoolId) || schools[0];
    schoolData.uploads = await loadUploads();
    schoolData.vacancies = await loadVacancies();
    schoolData.jobs = await loadJobs();
    schoolData.fees = await loadFees();

    // Render page
    renderDashboardHeader();
    renderFooter();

    // Load initial tab
    showTab('school-info');
}

/**
 * Render dashboard header
 */
function renderDashboardHeader() {
    const headerHTML = `
        <header>
            <div class="container">
                <h1>${schoolData.info.name || 'School Dashboard'}</h1>
                <p>Manage your school information, uploads, and vacancies</p>
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
                <p>&copy; 2026 Kenya School Fee Platform</p>
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

    // Remove active class
    const navLinks = document.querySelectorAll('.school-nav .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Add active class
    event.target.classList.add('active');

    // Load tab content
    switch (tabName) {
        case 'school-info':
            renderSchoolInfo();
            break;
        case 'upload-media':
            renderMediaUploadForm();
            break;
        case 'post-vacancy':
            renderVacancyForm();
            break;
        case 'post-jobs':
            renderJobsForm();
            break;
        case 'upload-results':
            renderResultsUploadForm();
            break;
        case 'manage-fees':
            renderFeesTable();
            break;
    }

    logActivity('dashboard_tab_view', { tabName, schoolId: currentSchoolId });
}

/**
 * Render school information
 */
function renderSchoolInfo() {
    const infoHTML = `
        <div class="alert alert-info">
            <h5>School Profile Information</h5>
        </div>
        <div class="form-group">
            <label>School Name</label>
            <input type="text" class="form-control" value="${schoolData.info.name || ''}" readonly>
        </div>
        <div class="form-group">
            <label>School Level</label>
            <input type="text" class="form-control" value="${schoolData.info.grade || ''}" readonly>
        </div>
        <div class="form-group">
            <label>School Type</label>
            <input type="text" class="form-control" value="${schoolData.info.type || ''}" readonly>
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" value="${schoolData.info.email || ''}" readonly>
        </div>
        <div class="form-group">
            <label>Phone</label>
            <input type="tel" class="form-control" value="${schoolData.info.phone || ''}" readonly>
        </div>
        <div class="form-group">
            <label>Location</label>
            <input type="text" class="form-control" value="${schoolData.info.location || ''}" readonly>
        </div>
        <button class="btn btn-primary" onclick="editSchoolInfo()">Edit Information</button>
    `;

    document.getElementById('school-info-container').innerHTML = infoHTML;
}

/**
 * Edit school information
 */
function editSchoolInfo() {
    alert('Edit mode - Update school information');
    logActivity('edit_school_info', { schoolId: currentSchoolId });
}

/**
 * Render media upload form
 */
function renderMediaUploadForm() {
    const formHTML = `
        <div class="alert alert-warning">
            <h5>Upload School Media</h5>
            <p>Images, videos, and documents must comply with our terms and require payment verification</p>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="termsAccepted"> I accept the Terms & Conditions
            </label>
        </div>
        <div class="form-group">
            <label>Media Type</label>
            <select class="form-control" id="mediaType">
                <option>Images</option>
                <option>Videos</option>
                <option>Documents</option>
                <option>Brochure</option>
            </select>
        </div>
        <div class="form-group">
            <label>Media Title</label>
            <input type="text" class="form-control" id="mediaTitle" placeholder="Enter media title">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="form-control" id="mediaDescription" placeholder="Describe the media"></textarea>
        </div>
        <div class="upload-form" onclick="document.getElementById('mediaFile').click()">
            <p>Click to upload or drag and drop</p>
            <p style="color: #999; font-size: 0.9rem;">PNG, JPG, MP4, PDF up to 100MB</p>
            <input type="file" id="mediaFile" style="display:none;">
        </div>
        <div class="form-group mt-3">
            <label>Payment Verified</label>
            <input type="checkbox" id="paymentVerified"> ✓ Payment of KES 1,000 verified
        </div>
        <button class="btn btn-success" onclick="submitMediaUpload()">Submit Upload</button>
    `;

    document.getElementById('upload-form-container').innerHTML = formHTML;
}

/**
 * Submit media upload
 */
function submitMediaUpload() {
    const termsAccepted = document.getElementById('termsAccepted').checked;
    const paymentVerified = document.getElementById('paymentVerified').checked;
    const mediaTitle = document.getElementById('mediaTitle').value;

    if (!termsAccepted || !paymentVerified) {
        alert('Please accept terms and verify payment');
        return;
    }

    if (!mediaTitle) {
        alert('Please enter a media title');
        return;
    }

    const upload = {
        id: generateUUID(),
        schoolId: currentSchoolId,
        schoolName: schoolData.info.name,
        title: mediaTitle,
        type: document.getElementById('mediaType').value,
        description: document.getElementById('mediaDescription').value,
        uploadedDate: new Date().toISOString(),
        status: 'pending',
        termsAccepted,
        paymentVerified
    };

    schoolData.uploads.push(upload);
    logActivity('media_uploaded', { uploadId: upload.id, schoolId: currentSchoolId });

    alert('Upload submitted for approval. Status: Pending Admin Review');
    document.getElementById('upload-form-container').innerHTML = '<div class="alert alert-success">Upload submitted successfully!</div>';
}

/**
 * Render vacancy posting form
 */
function renderVacancyForm() {
    const formHTML = `
        <div class="alert alert-info">
            <h5>Post School Vacancies</h5>
            <p>List available seats for different grades and streams</p>
        </div>
        <div class="form-group">
            <label>Grade Level</label>
            <select class="form-control" id="vacancyGrade">
                <option>Select Grade</option>
                <option>ECDE</option>
                <option>Grade 1</option>
                <option>Grade 2</option>
                <option>Grade 3</option>
                <option>Form 1</option>
                <option>Form 2</option>
            </select>
        </div>
        <div class="form-group">
            <label>Stream</label>
            <select class="form-control" id="vacancyStream">
                <option>Coed</option>
                <option>Boys</option>
                <option>Girls</option>
            </select>
        </div>
        <div class="form-group">
            <label>Maximum Capacity</label>
            <input type="number" class="form-control" id="maxCapacity" placeholder="Enter max students">
        </div>
        <div class="form-group">
            <label>Current Enrollment</label>
            <input type="number" class="form-control" id="currentEnrollment" placeholder="Enter current enrollment">
        </div>
        <div class="form-group">
            <label>Terms & Conditions</label>
            <textarea class="form-control" id="vacancyTerms" placeholder="Enter any special conditions"></textarea>
        </div>
        <button class="btn btn-primary" onclick="submitVacancy()">Post Vacancy</button>
    `;

    document.getElementById('vacancy-form-container').innerHTML = formHTML;
    renderVacanciesList();
}

/**
 * Submit vacancy
 */
function submitVacancy() {
    const grade = document.getElementById('vacancyGrade').value;
    const maxCapacity = parseInt(document.getElementById('maxCapacity').value);
    const currentEnrollment = parseInt(document.getElementById('currentEnrollment').value);

    if (grade === 'Select Grade' || !maxCapacity) {
        alert('Please fill in all required fields');
        return;
    }

    const vacancy = {
        id: generateUUID(),
        schoolId: currentSchoolId,
        schoolName: schoolData.info.name,
        grade,
        stream: document.getElementById('vacancyStream').value,
        maxCapacity,
        currentEnrollment,
        termsAndConditions: document.getElementById('vacancyTerms').value,
        postedDate: new Date().toISOString(),
        status: currentEnrollment >= maxCapacity ? 'closed' : 'open'
    };

    schoolData.vacancies.push(vacancy);
    logActivity('vacancy_posted', { vacancyId: vacancy.id, schoolId: currentSchoolId });

    alert('Vacancy posted successfully');
    renderVacanciesList();
    document.getElementById('vacancyGrade').value = 'Select Grade';
    document.getElementById('maxCapacity').value = '';
    document.getElementById('currentEnrollment').value = '';
}

/**
 * Render vacancies list
 */
function renderVacanciesList() {
    const vacanciesHTML = schoolData.vacancies.map(vacancy => {
        const remainingSeats = vacancy.maxCapacity - vacancy.currentEnrollment;
        return `
            <div class="vacancy-card ${vacancy.status}">
                <div class="vacancy-header">
                    <h4>${vacancy.grade} - ${vacancy.stream}</h4>
                    <span class="vacancy-status ${vacancy.status}">${vacancy.status.toUpperCase()}</span>
                </div>
                <div class="vacancy-details">
                    <div class="vacancy-detail-item">
                        <strong>Max Capacity</strong>
                        ${vacancy.maxCapacity}
                    </div>
                    <div class="vacancy-detail-item">
                        <strong>Current Enrollment</strong>
                        ${vacancy.currentEnrollment}
                    </div>
                    <div class="vacancy-detail-item">
                        <strong>Remaining Seats</strong>
                        ${remainingSeats}
                    </div>
                    <div class="vacancy-detail-item">
                        <strong>Posted</strong>
                        ${formatDate(vacancy.postedDate)}
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="closeVacancy('${vacancy.id}')">Close Vacancy</button>
            </div>
        `;
    }).join('');

    document.getElementById('vacancy-list-container').innerHTML = vacanciesHTML || '<p>No vacancies posted yet</p>';
}

/**
 * Close vacancy
 */
function closeVacancy(vacancyId) {
    const vacancy = schoolData.vacancies.find(v => v.id === vacancyId);
    if (vacancy) {
        vacancy.status = 'closed';
        vacancy.closedDate = new Date().toISOString();
        logActivity('vacancy_closed', { vacancyId, schoolId: currentSchoolId });
        renderVacanciesList();
    }
}

/**
 * Render jobs posting form
 */
function renderJobsForm() {
    const formHTML = `
        <div class="alert alert-info">
            <h5>Post Job Openings</h5>
            <p>Advertise job positions at your school</p>
        </div>
        <div class="form-group">
            <label>Job Position</label>
            <input type="text" class="form-control" id="jobPosition" placeholder="e.g., Mathematics Teacher">
        </div>
        <div class="form-group">
            <label>Department</label>
            <input type="text" class="form-control" id="jobDepartment" placeholder="e.g., Academics">
        </div>
        <div class="form-group">
            <label>Job Description</label>
            <textarea class="form-control" id="jobDescription" placeholder="Describe the job requirements and responsibilities"></textarea>
        </div>
        <div class="form-group">
            <label>Salary Range (KES)</label>
            <input type="number" class="form-control" id="jobSalary" placeholder="Monthly salary">
        </div>
        <button class="btn btn-primary" onclick="submitJobPosting()">Post Job</button>
    `;

    document.getElementById('jobs-form-container').innerHTML = formHTML;
    renderJobsList();
}

/**
 * Submit job posting
 */
function submitJobPosting() {
    const position = document.getElementById('jobPosition').value;
    const department = document.getElementById('jobDepartment').value;

    if (!position || !department) {
        alert('Please fill in all required fields');
        return;
    }

    const job = {
        id: generateUUID(),
        schoolId: currentSchoolId,
        schoolName: schoolData.info.name,
        position,
        department,
        description: document.getElementById('jobDescription').value,
        salary: parseInt(document.getElementById('jobSalary').value) || 0,
        postedDate: new Date().toISOString(),
        status: 'open'
    };

    schoolData.jobs.push(job);
    logActivity('job_posted', { jobId: job.id, schoolId: currentSchoolId });

    alert('Job posting submitted successfully');
    renderJobsList();
    document.getElementById('jobPosition').value = '';
    document.getElementById('jobDepartment').value = '';
}

/**
 * Render jobs list
 */
function renderJobsList() {
    const jobsHTML = schoolData.jobs.map(job => `
        <div class="job-card">
            <h4>${job.position}</h4>
            <div class="job-meta">
                <span><strong>Department:</strong> ${job.department}</span>
                <span><strong>Salary:</strong> KES ${job.salary.toLocaleString()}/month</span>
                <span><strong>Status:</strong> ${job.status}</span>
            </div>
            <p>${job.description}</p>
            <small>${formatDate(job.postedDate)}</small>
            <button class="btn btn-danger btn-sm" onclick="closeJobPosting('${job.id}')">Close Posting</button>
        </div>
    `).join('');

    document.getElementById('jobs-list-container').innerHTML = jobsHTML || '<p>No jobs posted yet</p>';
}

/**
 * Close job posting
 */
function closeJobPosting(jobId) {
    const job = schoolData.jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'closed';
        logActivity('job_closed', { jobId, schoolId: currentSchoolId });
        renderJobsList();
    }
}

/**
 * Render results upload form
 */
function renderResultsUploadForm() {
    const formHTML = `
        <div class="alert alert-warning">
            <h5>Upload Academic Results</h5>
            <p>Upload yearly exam results and academic performance data</p>
        </div>
        <div class="form-group">
            <label>Academic Year</label>
            <input type="text" class="form-control" id="academicYear" placeholder="e.g., 2025/2026">
        </div>
        <div class="form-group">
            <label>Grade Level</label>
            <select class="form-control" id="resultsGrade">
                <option>Select Grade</option>
                <option>Grade 4</option>
                <option>Grade 6</option>
                <option>Form 2</option>
                <option>Form 4</option>
            </select>
        </div>
        <div class="form-group">
            <label>Mean Score</label>
            <input type="number" class="form-control" id="meanScore" step="0.1" placeholder="e.g., 75.5">
        </div>
        <div class="form-group">
            <label>Upload Results File</label>
            <div class="upload-form" onclick="document.getElementById('resultsFile').click()">
                <p>Click to upload results document</p>
                <p style="color: #999; font-size: 0.9rem;">PDF or Excel file</p>
                <input type="file" id="resultsFile" style="display:none;">
            </div>
        </div>
        <button class="btn btn-success" onclick="submitResults()">Upload Results</button>
    `;

    document.getElementById('results-upload-container').innerHTML = formHTML;
}

/**
 * Submit results
 */
function submitResults() {
    const year = document.getElementById('academicYear').value;
    const meanScore = parseFloat(document.getElementById('meanScore').value);

    if (!year || !meanScore) {
        alert('Please fill in all required fields');
        return;
    }

    const resultUpload = {
        id: generateUUID(),
        schoolId: currentSchoolId,
        academicYear: year,
        grade: document.getElementById('resultsGrade').value,
        meanScore,
        uploadedDate: new Date().toISOString(),
        status: 'pending'
    };

    logActivity('results_uploaded', { uploadId: resultUpload.id, schoolId: currentSchoolId });
    alert('Results uploaded successfully. Status: Pending Admin Verification');
}

/**
 * Render fees table
 */
function renderFeesTable() {
    const feesHTML = `
        <div class="alert alert-info">
            <h5>School Fee Structure</h5>
        </div>
        <table class="fee-table">
            <thead>
                <tr>
                    <th>Grade/Level</th>
                    <th>Monthly Fee</th>
                    <th>Yearly Fee</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>ECDE</td>
                    <td>KES 5,000</td>
                    <td>KES 60,000</td>
                    <td>2025-01-01</td>
                </tr>
                <tr>
                    <td>Primary</td>
                    <td>KES 8,000</td>
                    <td>KES 96,000</td>
                    <td>2025-01-01</td>
                </tr>
                <tr>
                    <td>Secondary</td>
                    <td>KES 15,000</td>
                    <td>KES 180,000</td>
                    <td>2025-01-01</td>
                </tr>
            </tbody>
        </table>
        <button class="btn btn-primary mt-3" onclick="updateFees()">Update Fees</button>
    `;

    document.getElementById('fees-table-container').innerHTML = feesHTML;
}

/**
 * Update fees
 */
function updateFees() {
    alert('Update fees functionality');
    logActivity('fees_update_initiated', { schoolId: currentSchoolId });
}

/**
 * Load jobs data
 */
async function loadJobs() {
    try {
        const response = await fetch('data/jobs.json');
        if (!response.ok) throw new Error('Failed to load jobs');
        return await response.json();
    } catch (error) {
        console.error('Error loading jobs:', error);
        return [];
    }
}

/**
 * Load fees data
 */
async function loadFees() {
    try {
        const response = await fetch('data/fees.json');
        if (!response.ok) throw new Error('Failed to load fees');
        return await response.json();
    } catch (error) {
        console.error('Error loading fees:', error);
        return [];
    }
}

/**
 * Log activity
 */
function logActivity(activityType, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: activityType,
        details: details,
        schoolId: currentSchoolId
    };

    const logs = JSON.parse(localStorage.getItem('schoolLogs_' + currentSchoolId) || '[]');
    logs.push(logEntry);
    localStorage.setItem('schoolLogs_' + currentSchoolId, JSON.stringify(logs));
}
