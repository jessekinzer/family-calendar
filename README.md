# Family Calendar

A small web app for adding things to our family's Google Calendar. You type what's happening in plain English, tap one button, and it's on the calendar.

"Dentist Tuesday at 9am." "Soccer practice tomorrow at 5." "Birthday party Sunday." That's the whole interface.

## Why I built it

Adding an event in the Google Calendar app on a phone means filling out a form: title, date, start time, end time, save. For a calendar the whole family is supposed to use, that's enough hassle that things don't get added. This is one text box and one button.

## What it does

- Reads the date and time right out of your sentence. As you type, it highlights the part it understood, so you can see what it picked up before you send.
- Fills in the blanks. No end time means it books an hour. No time at all means it's an all-day event. A day of the week never lands in the past, and "today at 4" means this afternoon instead of 4 in the morning.
- Shows a quick confirmation with the event, date and time, then clears itself for the next one after a few seconds.
- Pings me on Slack when someone adds something, with a link to the event.
- Lives on your phone's home screen. It's a web app, but you can add it to your home screen and open it like any other app.

The empty text box shows a random Gilmore Girls quote each time you open it.

## How it works

It's one shared calendar. During setup, one Google account gets connected, and the app keeps permission to add events to that account's calendar. Everyone in the family uses the same link, and everything lands on that one calendar. There are no user accounts and no database.

## For developers

It's a Next.js app hosted on Vercel. Date parsing comes from [chrono-node](https://github.com/wanasit/chrono), with a few rules on top for the cases above.

### Setup

1. In Google Cloud, create a project, turn on the Google Calendar API, and create an OAuth client of type "Web application." Add `https://YOUR-DOMAIN/api/auth/google/callback` as an authorized redirect URI.
2. Set these environment variables in Vercel and deploy:

   | Variable | What it's for |
   |---|---|
   | `GOOGLE_CLIENT_ID` | From your OAuth client |
   | `GOOGLE_CLIENT_SECRET` | From your OAuth client |
   | `GOOGLE_REDIRECT_URI` | The callback URL from step 1 |
   | `CALENDAR_ID` | Optional. The calendar to write to. Defaults to the account's main calendar. |
   | `TIMEZONE` | Optional. Defaults to `America/Chicago`. |

3. Open `/setup` on your deployed site and click Connect with Google. When you finish, the page shows a token. Add it to Vercel as `GOOGLE_REFRESH_TOKEN` and redeploy.
4. Optional: for Slack pings, add `SLACK_WEBHOOK_URL` and `SLACK_USER_ID`. [SLACK_SETUP.md](SLACK_SETUP.md) walks through it.

If Google ever drops the connection, the app shows a Reconnect screen that sends you back through `/setup`.

### Running it locally

```sh
yarn install
yarn dev
```

Parser tests:

```sh
yarn test:parser
```
