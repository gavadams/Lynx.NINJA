# Link Scheduling Cron Setup

This document explains how to set up automated processing for scheduled and expired links.

## Overview

The link scheduling system includes:
- **Scheduled Links**: Links that go live at a specific time
- **Expired Links**: Links that automatically become inactive after a certain time
- **Background Processing**: Automated job to activate/deactivate links

## API Endpoint

The cron job should call this endpoint:
```
POST /api/cron/process-scheduled-links
```

### Authentication
Include the `CRON_SECRET` environment variable in the Authorization header:
```
Authorization: Bearer YOUR_CRON_SECRET
```

### Response
```json
{
  "success": true,
  "message": "Processed 5 scheduled links and 2 expired links",
  "activated": 5,
  "deactivated": 2,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Environment Variables

Add to your `.env.local` and production environment:

```bash
# Cron job secret for authentication
CRON_SECRET=your-secure-random-string-here
```

## Deployment Options

### Option 1: Vercel Cron Jobs (Recommended)

1. Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled-links",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. Set the `CRON_SECRET` environment variable in Vercel

### Option 2: GitHub Actions

Create `.github/workflows/process-scheduled-links.yml`:
```yaml
name: Process Scheduled Links
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-links:
    runs-on: ubuntu-latest
    steps:
      - name: Process scheduled links
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/process-scheduled-links
```

### Option 3: External Cron Service

Use services like:
- **Cron-job.org**: Free web-based cron service
- **EasyCron**: Reliable cron service
- **SetCronJob**: Simple cron service

Set up a job to call your endpoint every 5 minutes.

## Testing

Test the endpoint manually:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/process-scheduled-links
```

## Monitoring

The endpoint returns detailed information about processed links. Monitor:
- Number of links activated/deactivated
- Response times
- Error rates

## Frequency

**Recommended**: Every 5 minutes
- Balances responsiveness with resource usage
- Most scheduling needs don't require second-level precision
- Reduces server load

**Alternative**: Every minute for high-precision needs
- Use only if you need very precise timing
- Increases server load

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check `CRON_SECRET` environment variable
2. **500 Internal Server Error**: Check database connection and logs
3. **No links processed**: Verify links have correct `scheduledAt`/`expiresAt` values

### Logs

Check your deployment logs for:
- Cron job execution times
- Number of links processed
- Any errors during processing

### Manual Processing

You can manually trigger processing by calling the endpoint with proper authentication.
