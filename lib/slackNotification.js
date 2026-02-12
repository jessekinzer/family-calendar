import { format } from 'date-fns';

/**
 * Send a notification to Slack when a new calendar event is created
 * @param {Object} eventData - The event data
 * @param {string} eventData.title - Event title
 * @param {string} eventData.date - Event date (YYYY-MM-DD)
 * @param {string} eventData.startTime - Start time (HH:mm) or null for all-day
 * @param {string} eventData.endTime - End time (HH:mm) or null for all-day
 * @param {string} eventData.notes - Event notes (optional)
 * @param {boolean} eventData.isAllDay - Whether event is all-day
 * @param {Object} result - The result from Google Calendar API
 * @param {string} result.htmlLink - Link to view event in Google Calendar
 */
export async function sendSlackNotification(eventData, result) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  // Skip if no webhook URL configured
  if (!webhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification');
    return { success: false, skipped: true };
  }

  try {
    // Format the date nicely
    const eventDate = new Date(eventData.date + 'T12:00:00');
    const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');

    // Format time information
    let timeInfo;
    if (eventData.isAllDay) {
      timeInfo = 'All day';
    } else {
      // Convert 24h to 12h format
      const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      };
      timeInfo = `${formatTime(eventData.startTime)} - ${formatTime(eventData.endTime)}`;
    }

    // Build the Slack message with blocks for rich formatting
    const slackMessage = {
      text: `📅 New Calendar Event: ${eventData.title}`, // Fallback text
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📅 New Calendar Event Added',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Event:*\n${eventData.title}`
            },
            {
              type: 'mrkdwn',
              text: `*When:*\n${formattedDate}`
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${timeInfo}`
            }
          ]
        }
      ]
    };

    // Add notes section if notes exist
    if (eventData.notes && eventData.notes.trim()) {
      slackMessage.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Notes:*\n${eventData.notes}`
        }
      });
    }

    // Add button to view in Google Calendar
    if (result.htmlLink) {
      slackMessage.blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔗 View in Google Calendar',
              emoji: true
            },
            url: result.htmlLink,
            style: 'primary'
          }
        ]
      });
    }

    // Add a divider and timestamp at the bottom
    slackMessage.blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Added to calendar at ${new Date().toLocaleTimeString()}`
          }
        ]
      }
    );

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack notification failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log('Slack notification sent successfully');
    return { success: true };

  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return { success: false, error: error.message };
  }
}
