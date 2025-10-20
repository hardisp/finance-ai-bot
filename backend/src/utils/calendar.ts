import { google } from "googleapis";

export async function createEvent(userId: string, { summary, start, end, attendees }: any) {
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: "USER_ACCESS_TOKEN" });

  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: { summary, start: { dateTime: start }, end: { dateTime: end }, attendees },
  });

  return response.data;
}
