import { google } from "googleapis";

export async function send(userId: string, { to, subject, body }: { to: string; subject: string; body: string }) {
  // TODO: load user OAuth token from DB
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: "USER_ACCESS_TOKEN" });

  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`).toString("base64"),
    },
  });

  return { success: true };
}
