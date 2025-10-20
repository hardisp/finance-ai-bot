import React from "react";

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>FinanceAI — Starter</h1>
      <p>
        Backend API:{" "}
        <a href="http://localhost:4000/api/health">
          http://localhost:4000/api/health
        </a>
      </p>
      <div style={{ marginTop: 20 }}>
        <a href="/api/oauth/google">Connect Google (OAuth)</a>
      </div>
      <div style={{ marginTop: 8 }}>
        <a href="/api/oauth/hubspot">Connect HubSpot (OAuth)</a>
      </div>
    </div>
  );
}
