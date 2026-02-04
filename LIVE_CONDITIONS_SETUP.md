# Live Conditions Feed - Setup Guide

This guide explains how to set up the visitor-reported conditions feed for your hot springs directory.

## Overview

The Live Conditions Feed displays real-time visitor reports for each hot spring, showing:
- Recent crowd levels
- Water temperature (user-reported)
- Open/closed status
- Photos and notes
- "Last verified" timestamp

## Prerequisites

1. **Teable Account** with API access
2. **Two tables** in Teable:
   - `springs` (your existing hot springs data)
   - `reports` (new table for visitor submissions)
3. **API Token** with read access to both tables

## Step 1: Create Reports Table in Teable

### Table Structure

Create a new table named `reports` with these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `spring_slug` | Single line text | Link to spring (use the slug) |
| `visit_date` | Date | When they visited |
| `crowd_level` | Single select | 1-5 scale (see options below) |
| `water_temp` | Number | Optional: user-reported temp |
| `is_open` | Checkbox | Is the spring open? |
| `photo_url` | Single line text | Optional: photo URL |
| `notes` | Long text | Visitor notes/comments |
| `created_at` | Created time | Auto-filled by Teable |

### Crowd Level Options

Create a Single Select field with these options:
- **1** - Quiet (label: "Quiet")
- **2** - Light (label: "Light")
- **3** - Moderate (label: "Moderate")
- **4** - Busy (label: "Busy")
- **5** - Packed (label: "Packed")

**Important**: Use the number as the option name, but you can set the label to the text description.

## Step 2: Create Report Submission Form

### Option A: Teable Share Form (Recommended)

1. In Teable, go to your `reports` table
2. Click "Share" → "Create Form"
3. Configure the form:
   - **Title**: "Report Hot Spring Conditions"
   - **Description**: "Help others by sharing current conditions"
   - **Fields to include**: All fields except `created_at`
   - **Field settings**:
     - `spring_slug`: Hide field (we'll prefill it)
     - `crowd_level`: Required
     - `is_open`: Required, default to checked
     - `photo_url`: Optional, help text: "Upload to Imgur/etc and paste URL"

4. Get the share link (looks like: `https://teable-snickers-u27640.vm.elestio.app/share/form/{form-id}`)
5. Copy this URL for later use

### Option B: Custom Form

If you prefer a custom form, create an HTML form that POSTs to the Teable API:

```html
<form id="report-form">
  <input type="hidden" name="spring_slug" value="">
  <label>Visit Date: <input type="date" name="visit_date" required></label>
  <label>Crowd Level:
    <select name="crowd_level" required>
      <option value="1">Quiet</option>
      <option value="2">Light</option>
      <option value="3">Moderate</option>
      <option value="4">Busy</option>
      <option value="5">Packed</option>
    </select>
  </label>
  <label>Water Temp: <input type="number" name="water_temp"></label>
  <label>Open: <input type="checkbox" name="is_open" checked></label>
  <label>Photo URL: <input type="url" name="photo_url"></label>
  <label>Notes: <textarea name="notes"></textarea></label>
  <button type="submit">Submit Report</button>
</form>
```

## Step 3: Configure the Integration

### Update layouts/springs/single.html

The template is already updated to include:

```html
<!-- Live Conditions Feed Widget (added near action buttons) -->
{{ partial "conditions-feed.html" . }}

<!-- At the bottom of the page, before </body> -->
<script src="/js/conditions-feed.js"></script>
<script>
  window.TEABLE_API_TOKEN = '{{ getenv "TEABLE_API_TOKEN" }}';
</script>
```

### Set Environment Variable

Make sure your `.env` file includes:

```bash
TEABLE_API_TOKEN=your_token_here
```

### Update JavaScript Configuration

In `static/js/conditions-feed.js`, update these values:

```javascript
// Line ~5: Set your reports table ID
this.config = {
  teableBaseUrl: 'https://teable-snickers-u27640.vm.elestio.app',
  tableId: 'YOUR_REPORTS_TABLE_ID', // Get from Teable URL when viewing table
  apiToken: config.apiToken || '',
  springSlug: config.springSlug || '',
  maxReports: config.maxReports || 5,
  ...config
};

// Line ~133: Update the report form URL
const reportFormUrl = `https://teable-snickers-u27640.vm.elestio.app/share/form/YOUR_FORM_ID?prefill_spring_slug=${encodeURIComponent(this.config.springSlug)}`;
```

## Step 4: Teable API Query Example

### Fetch Reports for a Spring

```javascript
async fetchReports() {
  const url = `${this.config.teableBaseUrl}/api/table/${this.config.tableId}/record`;
  
  // Filter: get reports for specific spring
  const filter = {
    conjunction: "and",
    filterSet: [
      {
        fieldId: "spring_slug", // Use actual field ID from Teable
        operator: "is",
        value: this.config.springSlug // e.g., "sol-duc"
      }
    ]
  };
  
  // Sort: newest first
  const orderBy = [{
    fieldId: "created_at", // Use actual field ID
    order: "desc"
  }];
  
  const params = new URLSearchParams({
    filter: JSON.stringify(filter),
    orderBy: JSON.stringify(orderBy),
    take: 5, // Last 5 reports
    fieldKeyType: 'name' // Use field names instead of IDs
  });
  
  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer YOUR_API_TOKEN`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  
  // Transform to report objects
  return data.records.map(record => ({
    visitDate: record.fields.visit_date,
    crowdLevel: record.fields.crowd_level,
    waterTemp: record.fields.water_temp,
    isOpen: record.fields.is_open,
    photoUrl: record.fields.photo_url,
    notes: record.fields.notes,
    createdAt: record.fields.created_at
  }));
}
```

### API Response Format

```json
{
  "records": [
    {
      "id": "recXXXXXXXX",
      "fields": {
        "spring_slug": "sol-duc",
        "visit_date": "2024-01-15",
        "crowd_level": "3",
        "water_temp": "102",
        "is_open": true,
        "photo_url": "https://i.imgur.com/xxxxxx.jpg",
        "notes": "Beautiful morning soak! Water was perfect temp.",
        "created_at": "2024-01-15T14:30:00.000Z"
      },
      "createdTime": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

## Step 5: Testing

### Test the Feed

1. **View a spring page** in your browser
2. **Check for reports** - should show "No reports yet" initially
3. **Submit a test report** using your form
4. **Refresh the page** - report should appear within seconds

### Test Time Formatting

Reports should display as:
- "23 minutes ago"
- "3 hours ago"
- "2 days ago"
- "Jan 15, 2024" (if older than 7 days)

### Test Crowd Indicators

- 1 dot = Quiet
- 2 dots = Light
- 3 dots = Moderate
- 4 dots = Busy
- 5 dots = Packed

### Test Status Badges

- Green "OPEN" badge
- Red "CLOSED" badge

## Step 6: Troubleshooting

### "Cannot GET /api/table/{id}/record"

**Problem**: 404 error when fetching reports

**Solution**: 
1. Check your table ID is correct
2. Verify API token has read access
3. Ensure base URL matches your Teable instance

### Reports not showing up

**Problem**: Form submits but reports don't appear

**Solution**:
1. Check browser console for errors
2. Verify `spring_slug` matches exactly (case-sensitive)
3. Confirm `crowd_level` uses numbers 1-5, not text
4. Check API token has permission to read the table

### Time shows "Invalid Date"

**Problem**: Date formatting error

**Solution**:
1. Check `visit_date` format in Teable (should be YYYY-MM-DD)
2. Verify `created_at` is populated by Teable (should be automatic)

### Report button doesn't work

**Problem**: Nothing happens when clicking "Report Conditions"

**Solution**:
1. Update `reportFormUrl` in conditions-feed.js with your actual form URL
2. Check browser popup blocker
3. Verify form accepts `spring_slug` prefill parameter

## Customization

### Change Number of Reports

Edit `static/js/conditions-feed.js`:

```javascript
// Line ~8
maxReports: config.maxReports || 10, // Show 10 instead of 5
```

### Customize Crowd Labels

```javascript
// Line ~260
getCrowdLabel(level) {
  const labels = {
    1: 'Empty',
    2: 'Few people',
    3: 'Half full',
    4: 'Mostly full',
    5: 'Standing room only'
  };
  return labels[level] || 'Unknown';
}
```

### Add More Fields

Edit the `createReportHTML` method to include additional fields from your reports table.

## Security Notes

⚠️ **Important**:
- Never commit `.env` to git (already in `.gitignore`)
- Use read-only API token for public-facing pages
- Consider rate limiting on the Teable API
- Photo URLs should be from trusted sources (Imgur, S3, etc.)

## Support

- Teable API Docs: https://help.teable.io/en/articles/9356083-api
- Ghost Handlebars: https://ghost.org/docs/themes/
- JavaScript fetch: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## Example Final Result

```html
<div class="conditions-widget">
  <div class="conditions-header">
    <h3>📊 Live Conditions Feed</h3>
    <div class="last-verified">Last verified: 3 hours ago</div>
  </div>
  
  <div class="reports-list">
    <div class="report-item">
      <div class="report-header">
        <div class="crowd-indicator">
          <div class="crowd-dot active"></div>
          <div class="crowd-dot active"></div>
          <div class="crowd-dot active"></div>
          <div class="crowd-dot"></div>
          <div class="crowd-dot"></div>
          <span class="crowd-label">Moderate</span>
        </div>
        <div><span class="status-badge status-open">Open</span></div>
        <div class="report-time">3 hours ago</div>
      </div>
      <div class="report-details">
        <div class="detail-item">
          <span class="detail-label">Water Temp</span>
          <span class="detail-value">102°F</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Visit Date</span>
          <span class="detail-value">Jan 15, 2024</span>
        </div>
      </div>
      <div class="report-notes">
        <strong>Note:</strong> Beautiful morning soak! Water was perfect temp.
      </div>
    </div>
  </div>
  
  <div class="report-button-container">
    <button class="report-btn">📝 Report Current Conditions</button>
  </div>
</div>
```
