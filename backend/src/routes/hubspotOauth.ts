import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/hubspot", (req, res) => {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirect = `${process.env.APP_URL}/api/oauth/hubspot/callback`;
  const scope = encodeURIComponent(
    "crm.objects.contacts.read crm.objects.contacts.write crm.objects.notes.read crm.objects.notes.write"
  );
  const url = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirect
  )}&scope=${scope}`;
  res.redirect(url);
});

router.get("/hubspot/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("Missing code");
  try {
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID || "",
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
        redirect_uri: `${process.env.APP_URL}/api/oauth/hubspot/callback`,
        code,
      }),
    });
    const tokens = await tokenRes.json();
    // TODO: store tokens in DB
    res.send("HubSpot OAuth success. Close this window.");
  } catch (err) {
    console.error(err);
    res.status(500).send("HubSpot OAuth callback error");
  }
});

export default router;
