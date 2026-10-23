/**
 * Connects Google Calendar: opens Google's sign-in, then saves the refresh token
 * to .env.local (never printed). Run once, after setting GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET from a "Desktop app" OAuth client.
 *
 *   npm run google:connect
 */
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.");
  process.exit(1);
}

// Only what's needed: create and change events (with Meet links), nothing else in the account
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const state = randomBytes(16).toString("hex");

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname !== "/") return res.writeHead(404).end();

  const finish = (status: number, message: string) => {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" }).end(message);
    server.close();
  };

  if (url.searchParams.get("state") !== state) return finish(400, "That sign-in didn't match. Run npm run google:connect again.");
  const code = url.searchParams.get("code");
  if (!code) return finish(400, `Google didn't connect (${url.searchParams.get("error") ?? "no code"}). Run npm run google:connect again.`);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tokens = (await tokenRes.json()) as { refresh_token?: string; error?: string };
  if (!tokens.refresh_token) {
    console.error(`No refresh token from Google (${tokens.error ?? "missing"}).`);
    return finish(500, "Google didn't return a refresh token. See the terminal.");
  }

  const envPath = ".env.local";
  const lines = readFileSync(envPath, "utf8").split("\n").filter((l) => !l.startsWith("GOOGLE_REFRESH_TOKEN="));
  lines.push(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  writeFileSync(envPath, lines.join("\n").replace(/\n+$/, "") + "\n");

  console.log("Connected. Saved the refresh token to .env.local. Restart npm run dev to use it.");
  finish(200, "Njia is connected to Google Calendar. You can close this tab.");
});

let redirectUri = "";
server.listen(0, "127.0.0.1", () => {
  const { port } = server.address() as { port: number };
  redirectUri = `http://127.0.0.1:${port}/`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    // Always ask, so Google always returns a refresh token
    prompt: "consent",
    state,
  }).toString();
  console.log("Opening Google sign-in. If it doesn't open, visit:\n" + auth.toString());
  execFile("open", [auth.toString()], () => {});
});
