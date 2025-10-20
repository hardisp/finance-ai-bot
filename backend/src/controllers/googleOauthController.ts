import { Request, Response } from "express";
import { google } from "googleapis";
import { prisma } from "../../prisma/client.js";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar",
];

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/api/google/oauth/callback`
);

export const googleLogin = (req: Request, res: Response) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("No code provided");

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    if (!email) throw new Error("Could not get user email");

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: userInfo.data.name || "Unknown" },
    });

    await prisma.token.upsert({
      where: {
        userId_provider: { userId: user.id, provider: "google" } as any,
      }, // workaround for TS
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
      },
      create: {
        userId: user.id,
        provider: "google",
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
      },
    });

    res.send("Google OAuth successful! You can close this tab.");
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth failed");
  }
};
