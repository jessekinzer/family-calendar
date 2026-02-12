# Slack Notifications Setup Guide

This guide will help you set up Slack notifications for your Family Calendar app. When someone adds an event to the calendar, you'll receive a nicely formatted notification in Slack.

## Features

✅ Real-time notifications when events are created
✅ Beautifully formatted messages with event details
✅ "View in Google Calendar" button for quick access
✅ Shows event title, date, time, and notes
✅ 100% FREE - no cost for Slack webhooks
✅ Works on mobile and desktop

## Setup Instructions

### Step 1: Create a Slack Webhook (5 minutes)

1. **Go to Slack API website**
   - Visit: https://api.slack.com/apps
   - Click "Create New App"

2. **Choose "From scratch"**
   - App Name: "Family Calendar" (or any name you prefer)
   - Pick your workspace from the dropdown
   - Click "Create App"

3. **Enable Incoming Webhooks**
   - In the left sidebar, click "Incoming Webhooks"
   - Toggle the switch to "On" (top right)
   - Scroll down and click "Add New Webhook to Workspace"

4. **Select a Channel**
   - Choose where notifications should appear
   - Recommended: Create a dedicated `#family-calendar` channel first
   - Or use any existing channel (e.g., `#family`, `#home`)
   - Click "Allow"

5. **Copy the Webhook URL**
   - You'll see a URL that looks like:
     ```
     https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
     ```
   - Click "Copy" to copy this URL
   - Keep this URL secure - anyone with it can post to your Slack

### Step 2: Add Webhook URL to Vercel

1. **Go to your Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your family-calendar project

2. **Navigate to Environment Variables**
   - Click "Settings" tab
   - Click "Environment Variables" in the left sidebar

3. **Add the Slack Webhook URL**
   - Click "Add New" (or similar button)
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Paste the webhook URL you copied from Slack
   - Environment: Select all (Production, Preview, Development)
   - Click "Save"

### Step 3: Redeploy Your Application

After adding the environment variable, you need to redeploy:

**Option A: Automatic (Recommended)**
- Push any change to your GitHub repository
- Vercel will automatically redeploy

**Option B: Manual Redeploy**
- In Vercel Dashboard, go to "Deployments" tab
- Click the three dots (...) on the latest deployment
- Click "Redeploy"

### Step 4: Test It Out!

1. Open your Family Calendar app
2. Add a test event (e.g., "Test event tomorrow at 3pm")
3. Submit the event
4. Check your Slack channel - you should see a notification! 🎉

## What the Notifications Look Like

When an event is created, you'll receive a Slack message that includes:

```
📅 New Calendar Event Added

Event: Dinner at Italian restaurant
When: Thursday, February 13, 2025
Time: 6:00 PM - 7:00 PM

Notes: Don't forget to make a reservation

[View in Google Calendar] ← clickable button

Added to calendar at 2:30:45 PM
```

## Customization Options

Want to customize the notifications? Edit `/lib/slackNotification.js`:

### Change the Emoji
```javascript
// Line 58 - Change the emoji
text: '🎉 New Calendar Event Added'  // Try: 🎉 📆 🗓️ ⏰
```

### Mention Someone
```javascript
// Add at the top of the message
text: '<@USER_ID> New event added!'
// Get USER_ID from: Slack → Profile → More → Copy member ID
```

### Add More Fields
```javascript
// Add to the fields array
{
  type: 'mrkdwn',
  text: `*Created by:*\nSarah`
}
```

### Change Colors
```javascript
// Add to the section block
color: '#36a64f'  // Green for success
```

## Troubleshooting

### Not Receiving Notifications?

1. **Check Environment Variable**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `SLACK_WEBHOOK_URL` exists and is correct
   - Make sure it's enabled for the environment you're testing

2. **Check Browser Console**
   - Open browser DevTools (F12)
   - Look for errors in the Console tab
   - Check Network tab for failed requests

3. **Check Vercel Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check "Functions" tab for error logs
   - Look for "Slack notification" messages

4. **Test the Webhook Directly**
   ```bash
   curl -X POST \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```
   If this works, the webhook is valid.

5. **Common Issues**
   - **"invalid_token"**: Webhook URL is incorrect or expired
   - **"channel_not_found"**: The channel was deleted
   - **No error but no message**: Check you're looking at the right channel

### Webhook URL Expired?

Slack webhooks can be revoked. To create a new one:
1. Go to https://api.slack.com/apps
2. Select your "Family Calendar" app
3. Go to "Incoming Webhooks"
4. Click "Add New Webhook to Workspace"
5. Update the `SLACK_WEBHOOK_URL` in Vercel
6. Redeploy

## Multiple Notification Channels

Want notifications in different channels for different people?

### Option 1: Multiple Webhooks (Notify Multiple Channels)
```javascript
// In slackNotification.js, add multiple webhooks:
const webhookUrls = [
  process.env.SLACK_WEBHOOK_URL_1,  // #family
  process.env.SLACK_WEBHOOK_URL_2,  // #personal
];

for (const url of webhookUrls) {
  if (url) await fetch(url, { /* ... */ });
}
```

### Option 2: Use @mentions
```javascript
// Mention specific people in the notification
text: `<@U123456> <@U789012> New event added!`
```

## Privacy & Security

- **Webhook URL is sensitive**: Anyone with it can post to your Slack
- **Don't commit it to Git**: Always use environment variables
- **Rotate if exposed**: Create a new webhook if the URL is leaked
- **Channel permissions**: Only people in the channel see notifications

## Cost

**100% FREE** 🎉

- Slack webhooks are completely free
- No message limits
- No API quotas to worry about

## Next Steps

- Create a dedicated `#family-calendar` Slack channel
- Invite family members to the channel
- Consider adding @mentions for important events
- Explore Slack's Block Kit for more customization: https://api.slack.com/block-kit

## Need Help?

- Slack API Documentation: https://api.slack.com/messaging/webhooks
- Report issues: https://github.com/anthropics/claude-code/issues

---

Enjoy your new Slack notifications! 📅 → 💬
