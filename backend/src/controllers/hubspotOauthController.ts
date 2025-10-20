import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../../prisma/client.js";

const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID!;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.APP_URL}/api/hubspot/oauth/callback`;

export const hubspotLogin = (req: Request, res: Response) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=contacts%20crm.objects.contacts.read%20crm.objects.contacts.write&response_type=code`;
  res.redirect(authUrl);
};

export const hubspotCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("No code provided");

  try {
    // Exchange code for access token
    const tokenResp = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResp.data;

    // Get user info
    const meResp = await axios.get("https://api.hubapi.com/oauth/v1/access-tokens/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const email = meResp.data.user.email;

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: meResp.data.user.userName || "HubSpot User" },
    });

    // Upsert token
    await prisma.token.upsert({
      where: { userId_provider: { userId: user.id, provider: "hubspot" } },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined,
      },
      create: {
        userId: user.id,
        provider: "hubspot",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined,
      },
    });

    res.send("HubSpot OAuth successful! You can close this tab.");
  } catch (err) {
    console.error(err);
    res.status(500).send("HubSpot OAuth failed");
  }
};
