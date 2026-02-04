# Teable Integration Guide

This guide explains how to sync hot springs data from Teable to your Hugo site.

## Prerequisites

- `jq` installed (for JSON processing)
  - macOS: `brew install jq`
  - Ubuntu/Debian: `sudo apt-get install jq`
  - Windows: Download from https://stedolan.github.io/jq/

## Setup

### 1. Get Your Teable API Token

1. Go to your Teable instance: https://teable-snickers-u27640.vm.elestio.app
2. Click on your profile/avatar (top right)
3. Select "Personal Access Token"
4. Generate a new token or copy an existing one

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
echo "TEABLE_API_TOKEN=your_token_here" > .env
source .env
```

Or set it directly:

```bash
export TEABLE_API_TOKEN="your_token_here"
```

**⚠️ IMPORTANT:** Never commit `.env` to git. It's already in `.gitignore`.

### 3. Verify Setup

Test the connection:

```bash
echo $TEABLE_API_TOKEN
./sync-from-teable.sh
```

## Usage

### Sync Data from Teable

```bash
./sync-from-teable.sh
```

This will:
1. Fetch all records from your Teable table
2. Transform them to the correct JSON format
3. Save to `data/springs.json`
4. Optionally update Hugo content files

### Build Hugo Content Files

```bash
./build-pages.sh
```

This will:
1. Read `data/springs.json`
2. Generate individual markdown files for each spring
3. Save them to `content/springs/`

### Full Sync and Build

```bash
./sync-from-teable.sh && ./build-pages.sh
```

## Data Structure

### Expected Fields in Teable

Make sure your Teable table has these columns (field names should match exactly):

- `Name` (Single line text)
- `slug` (Single line text, URL-friendly name e.g., "sol-duc")
- `temp_f` (Number)
- `fee` (Number)
- `gps` (Single line text)
- `description` (Long text)
- `Access_Type` (Single line text)
- `Hours` (Single line text)
- `Season` (Single line text)
- `Clothing` (Single line text)
- `Cell_Coverage` (Single line text)
- `Road_Condition` (Single line text)
- `Parking` (Single line text)
- `Fee_Notes` (Single line text)
- `Best_Time_to_Visit` (Single line text)
- `Avoid_When` (Single line text)
- `Insider_Tips` (Long text)
- `Nearby_Gems` (Long text)
- `Last_Verified` (Date)
- `Maintenance_Day` (Single line text)
- `Alerts` (Long text)

### Output JSON Structure

The script generates `data/springs.json` with this format:

```json
[
  {
    "name": "Spring Name",
    "slug": "spring-name",
    "temp_f": 102,
    "fee": 15,
    "gps": "47.1234° N, 121.5678° W",
    "description": "Description here",
    "access_type": "drive-up",
    "hours": "9 AM - 8 PM",
    "season": "year-round",
    "clothing": "required",
    "cell_coverage": "Verizon: 2 bars",
    "road_condition": "Paved road",
    "parking": "Large lot available",
    "fee_notes": "Cash only",
    "best_time": "Weekday mornings",
    "avoid_when": "Holiday weekends",
    "insider_tips": "Bring water shoes",
    "nearby_gems": "Nearby hiking trail",
    "last_verified": "2024-01-15",
    "maintenance_day": "Closed Tuesdays",
    "alerts": "No current alerts"
  }
]
```

## Troubleshooting

### "jq: command not found"

Install jq:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install jq

# Check installation
jq --version
```

### "TEABLE_API_TOKEN environment variable not set"

Make sure you've set the token:
```bash
export TEABLE_API_TOKEN="your_token_here"
./sync-from-teable.sh
```

### "Could not connect to Teable API"

- Check your internet connection
- Verify the TEABLE_API_TOKEN is correct
- Ensure the Teable instance is running

### API Errors

If you get API errors, check:
1. Your API token has access to the table
2. The table ID is correct: `tbl0ZdZarej0x4Pv7lG`
3. You have permission to read records

## Automation

### Add to Build Process

Add to your `build-pages.sh`:

```bash
#!/bin/bash

# First sync from Teable
./sync-from-teable.sh

# Then build Hugo content
# ... rest of the script
```

### GitHub Actions

For automated builds, add the API token as a GitHub Secret:

1. Go to GitHub repo > Settings > Secrets > Actions
2. Add `TEABLE_API_TOKEN` secret
3. Update your workflow:

```yaml
- name: Sync from Teable
  env:
    TEABLE_API_TOKEN: ${{ secrets.TEABLE_API_TOKEN }}
  run: ./sync-from-teable.sh
```

## Security Best Practices

1. **Never** commit `.env` files
2. **Never** hardcode API tokens in scripts
3. Use environment variables or secure vaults
4. Rotate API tokens regularly
5. Use least-privilege tokens (read-only if possible)

## Support

- Teable API Docs: https://help.teable.io/en/articles/9356083-api
- jq Manual: https://stedolan.github.io/jq/manual/
- Hugo Data Templates: https://gohugo.io/templates/data-templates/
