/* ============================================
   KSSFK - Main Parent Portal Script
   ============================================ */

let allSchools = [];
let filteredSchools = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
});

/**
 * Initialize the parent portal
 */
async function initializePage() {
    // Load schools data
    allSchools = await loadSchools();

    // Render header
    renderHeader();

    // Render filter form
    renderFilterForm();

    // Render initial results
    displaySchools(allSchools);

    // Render charts
    renderCharts();

    // Render footer
    renderFooter();
}

/**
 * Render header component
 */
function renderHeader() {
    const headerHTML = `
        <header>
            <div class="container">
                <h1>Kenya School Fee Platform (KSSFK)</h1>
                <p>Find and Compare Schools by Fees, Quality, and Streams</p>
            </div>
        </header>
    `;
    document.getElementById('header-container').innerHTML = headerHTML;
}

/**
 * Render footer component
 */
function renderFooter() {
    const footerHTML = `
        <footer>
            <div class="container">
                <p>&copy; 2026 Kenya School Fee Platform. All rights reserved.</p>
                <p>Developer: Wamoto Raphael | Meru University | Phone: 0768331888</p>
            </div>
        </footer>
    `;
    document.getElementById('footer-container').innerHTML = footerHTML;
}

/**
 * Render filter form
 */
function renderFilterForm() {
    const formHTML = `
        <div class="filter-form">
            <h3>Filter Schools</h3>
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>School Level</label>
                        <select id="gradeFilter" class="form-control" onchange="applyFilters()">
                            <option value="">All Levels</option>
                            <option value="ECDE">ECDE</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="University">University</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Stream/Gender</label>
                        <select id="streamFilter" class="form-control" onchange="applyFilters()">
                            <option value="">All Streams</option>
                            <option value="Coed">Co-educational</option>
                            <option value="Boys">Boys Only</option>
                            <option value="Girls">Girls Only</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Max Monthly Fee (KES)</label>
                        <input type="number" id="maxFeeFilter" class="form-control" 
                               placeholder="Enter max fee" onchange="applyFilters()">
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Sort By</label>
                        <select id="sortFilter" class="form-control" onchange="applyFilters()">
                            <option value="score">Best Match (Score)</option>
                            <option value="fee">Fee (Low to High)</option>
                            <option value="name">School Name</option>
                        </select>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
        </div>
    `;
    document.getElementById('filter-form-container').innerHTML = formHTML;
}

/**
 * Apply filters and update results
 */
function applyFilters() {
    const filters = {
        grade: document.getElementById('gradeFilter').value || null,
        stream: document.getElementById('streamFilter').value || null,
        maxFee: parseInt(document.getElementById('maxFeeFilter').value) || null,
    };

    const sortBy = document.getElementById('sortFilter').value || 'score';

    // Apply filters
    filteredSchools = filterSchools(allSchools, filters);

    // Calculate scores and apply private fee logic
    filteredSchools = filteredSchools.map(school => ({
        ...school,
        score: scoreSchool(school)
    }));

    // Apply sorting
    filteredSchools = sortSchools(filteredSchools, sortBy, 'desc');

    // Display results
    displaySchools(filteredSchools);

    logActivity('filter_applied', filters);
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('gradeFilter').value = '';
    document.getElementById('streamFilter').value = '';
    document.getElementById('maxFeeFilter').value = '';
    document.getElementById('sortFilter').value = 'score';

    displaySchools(allSchools);
    logActivity('filter_reset', {});
}

/**
 * Display schools in results table
 */
function displaySchools(schools) {
    const resultsHTML = `
        <div class="results-table">
            <table>
                <thead>
                    <tr>
                        <th>School Name</th>
                        <th>Level</th>
                        <th>Stream</th>
                        <th>Type</th>
                        <th>Monthly Fee</th>
                        <th>Score</th>
                        <th>Vacancies</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${schools.map(school => `
                        <tr>
                            <td><strong>${school.name}</strong></td>
                            <td>${school.grade}</td>
                            <td>${school.streams.join(', ')}</td>
                            <td><span class="badge badge-${school.type === 'private' ? 'danger' : 'success'}">${school.type}</span></td>
                            <td>${formatCurrency(school.monthlyFee)}</td>
                            <td><strong>${school.score || scoreSchool(school)}</strong>/100</td>
                            <td>${school.vacancyRate}%</td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="viewSchoolDetails('${school.id}')">View</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${schools.length === 0 ? '<p class="text-center mt-3">No schools match your criteria</p>' : ''}
    `;

    document.getElementById('results-table-container').innerHTML = resultsHTML;
}

/**
 * View detailed school information
 */
function viewSchoolDetails(schoolId) {
    const school = allSchools.find(s => s.id === schoolId);
    if (!school) return;

    const details = `
        <div class="school-card">
            <h4>${school.name}</h4>
            <p><strong>Level:</strong> ${school.grade}</p>
            <p><strong>Streams:</strong> ${school.streams.join(', ')}</p>
            <p><strong>Type:</strong> ${school.type}</p>
            <p><strong>Monthly Fee:</strong> ${formatCurrency(school.monthlyFee)}</p>
            <p><strong>Yearly Fee:</strong> ${formatCurrency(school.yearlyFee)}</p>
            <p><strong>Academic Rating:</strong> ${school.academicRating}/10</p>
            <p><strong>Infrastructure:</strong> ${school.infrastructure}/10</p>
            <p><strong>Facilities:</strong> ${school.facilities}/10</p>
            <p><strong>Vacancies:</strong> ${school.vacancyRate}%</p>
            <p><strong>Contact:</strong> ${school.phone}</p>
            <p><strong>Email:</strong> ${school.email}</p>
            <button class="btn btn-primary" onclick="enrollSchool('${schoolId}')">Enroll Now</button>
        </div>
    `;

    alert('School Details:\n' + school.name);
    logActivity('view_school_details', { schoolId });
}

/**
 * Enroll in a school
 */
function enrollSchool(schoolId) {
    const school = allSchools.find(s => s.id === schoolId);
    if (!school) return;

    const enrollment = {
        enrollmentId: generateUUID(),
        schoolId,
        schoolName: school.name,
        enrollmentDate: new Date().toISOString(),
        status: 'pending',
        parentEmail: localStorage.getItem('parentEmail') || 'parent@example.com'
    };

    Storage.set(`enrollment_${enrollment.enrollmentId}`, enrollment);
    logActivity('enrollment_submitted', { schoolId, schoolName: school.name });

    alert('Enrollment submitted successfully! Your enrollment ID: ' + enrollment.enrollmentId);
}

/**
 * Render analytics charts
 */
function renderCharts() {
    const chartsHTML = `
        <div class="chart-container">
            <h3>Fee Trends by School Type</h3>
            <p>Average fees for private vs public schools across different levels</p>
            <!-- Chart will be rendered here -->
        </div>
        <div class="chart-container">
            <h3>Popular Streams</h3>
            <p>Stream distribution across all schools</p>
            <!-- Chart will be rendered here -->
        </div>
    `;

    // Placeholder for chart rendering
    // In production, use Chart.js library
}
