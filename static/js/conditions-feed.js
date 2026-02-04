// Live Conditions Feed - Teable API Integration
class ConditionsFeed {
    constructor(config) {
        this.config = {
            teableBaseUrl: config.teableBaseUrl || 'https://teable-snickers-u27640.vm.elestio.app',
            tableId: config.tableId || 'reports', // You'll need to set your actual reports table ID
            apiToken: config.apiToken || '',
            springSlug: config.springSlug || '',
            maxReports: config.maxReports || 5,
            ...config
        };
        
        this.container = document.getElementById('reports-container');
        this.lastVerifiedElement = document.getElementById('last-verified-time');
        this.reportButton = document.getElementById('report-conditions-btn');
        
        this.init();
    }
    
    init() {
        if (!this.config.apiToken) {
            console.error('Teable API token not provided');
            this.showError('API configuration missing');
            return;
        }
        
        if (!this.config.springSlug) {
            console.error('Spring slug not provided');
            this.showError('Spring configuration missing');
            return;
        }
        
        this.loadReports();
        this.setupReportButton();
    }
    
    async loadReports() {
        try {
            const reports = await this.fetchReports();
            this.displayReports(reports);
            this.updateLastVerified(reports);
        } catch (error) {
            console.error('Failed to load reports:', error);
            this.showError('Unable to load reports. Please try again later.');
        }
    }
    
    async fetchReports() {
        // Query Teable API for reports
        const url = `${this.config.teableBaseUrl}/api/table/${this.config.tableId}/record`;
        
        // Build filter to get reports for this spring, sorted by date
        const filter = {
            conjunction: "and",
            filterSet: [
                {
                    fieldId: "spring_slug", // You'll need to use your actual field ID
                    operator: "is",
                    value: this.config.springSlug
                }
            ]
        };
        
        const params = new URLSearchParams({
            filter: JSON.stringify(filter),
            orderBy: JSON.stringify([{
                fieldId: "created_at", // Use actual field ID
                order: "desc"
            }]),
            take: this.config.maxReports,
            fieldKeyType: 'name'
        });
        
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Transform Teable records to report objects
        return data.records.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                visitDate: fields.visit_date,
                crowdLevel: fields.crowd_level,
                waterTemp: fields.water_temp,
                isOpen: fields.is_open,
                photoUrl: fields.photo_url,
                notes: fields.notes,
                createdAt: fields.created_at
            };
        });
    }
    
    displayReports(reports) {
        if (!reports || reports.length === 0) {
            this.showNoReports();
            return;
        }
        
        const html = reports.map(report => this.createReportHTML(report)).join('');
        this.container.innerHTML = html;
    }
    
    createReportHTML(report) {
        const timeAgo = this.formatTimeAgo(report.createdAt);
        const crowdIndicator = this.createCrowdIndicator(report.crowdLevel);
        const statusBadge = this.createStatusBadge(report.isOpen);
        const tempDisplay = report.waterTemp ? `${report.waterTemp}°F` : 'Not reported';
        const photoHTML = report.photoUrl ? this.createPhotoHTML(report.photoUrl) : '';
        const notesHTML = report.notes ? `
            <div class="report-notes">
                <strong>Note:</strong> ${this.truncateText(report.notes, 200)}
            </div>
        ` : '';
        
        return `
            <div class="report-item">
                <div class="report-header">
                    <div class="crowd-indicator">
                        ${crowdIndicator}
                        <span class="crowd-label">${this.getCrowdLabel(report.crowdLevel)}</span>
                    </div>
                    <div>${statusBadge}</div>
                    <div class="report-time">${timeAgo}</div>
                </div>
                
                <div class="report-details">
                    <div class="detail-item">
                        <span class="detail-label">Water Temp</span>
                        <span class="detail-value">${tempDisplay}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Visit Date</span>
                        <span class="detail-value">${this.formatDate(report.visitDate)}</span>
                    </div>
                </div>
                
                ${notesHTML}
                ${photoHTML}
            </div>
        `;
    }
    
    createCrowdIndicator(level) {
        // Level 1-5, show that many active dots
        const dots = [];
        for (let i = 1; i <= 5; i++) {
            const active = i <= level ? 'active' : '';
            dots.push(`<div class="crowd-dot ${active}"></div>`);
        }
        return dots.join('');
    }
    
    createStatusBadge(isOpen) {
        const status = isOpen ? 'open' : 'closed';
        const text = isOpen ? 'Open' : 'Closed';
        return `<span class="status-badge status-${status}">${text}</span>`;
    }
    
    createPhotoHTML(photoUrl) {
        return `
            <div class="report-photo">
                <img src="${photoUrl}" alt="Report photo" loading="lazy">
            </div>
        `;
    }
    
    updateLastVerified(reports) {
        if (reports && reports.length > 0) {
            const latestReport = reports[0];
            const timeAgo = this.formatTimeAgo(latestReport.createdAt);
            this.lastVerifiedElement.textContent = timeAgo;
        } else {
            this.lastVerifiedElement.textContent = 'No reports yet';
        }
    }
    
    setupReportButton() {
        if (!this.reportButton) return;
        
        // Link to Teable form or external reporting form
        // You'll need to update this URL with your actual Teable form
        const reportFormUrl = `https://teable-snickers-u27640.vm.elestio.app/share/form/your-form-id?prefill_spring_slug=${encodeURIComponent(this.config.springSlug)}`;
        
        this.reportButton.addEventListener('click', () => {
            // Open report form in new window
            window.open(reportFormUrl, '_blank', 'width=800,height=600');
            
            // Or use a modal if you prefer
            // this.openReportModal();
        });
    }
    
    formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString();
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    getCrowdLabel(level) {
        const labels = {
            1: 'Quiet',
            2: 'Light',
            3: 'Moderate',
            4: 'Busy',
            5: 'Packed'
        };
        return labels[level] || 'Unknown';
    }
    
    showNoReports() {
        this.container.innerHTML = `
            <div class="no-reports">
                <p>No condition reports yet for this spring.</p>
                <p>Be the first to report current conditions!</p>
            </div>
        `;
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div class="no-reports">
                <p>⚠️ ${message}</p>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const conditionsFeed = document.getElementById('conditions-feed');
    
    if (conditionsFeed) {
        const springSlug = conditionsFeed.dataset.springSlug;
        const apiToken = window.TEABLE_API_TOKEN; // Set this in your template
        
        new ConditionsFeed({
            springSlug: springSlug,
            apiToken: apiToken,
            tableId: 'reports' // Replace with your actual reports table ID
        });
    }
});
