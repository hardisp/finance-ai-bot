# Main Tasks AI AGENT Advisors

Below is a complete, practical design and implementation plan you (or I, if hired) can use to build the Financial-Advisor AI agent that integrates Gmail, Google Calendar and HubSpot. I’ll include:

- architecture and component diagram (textual)
- tech stack and libraries (TypeScript-first)
- OAuth scopes and exact steps (including adding webshookeng@gmail.com as Google test user)
- database schema (Postgres + pgvector) and suggestions for task memory/state
- ingestion / RAG pipeline for Gmail + HubSpot
- the agent design (tool calling, prompts, workflows)
- webhooks vs polling, how to handle async tasks (Durable workflows)
- sample TypeScript code snippets for critical pieces (OAuth routes, webhook endpoints, tool wrappers)
- security, testing & rollout checklist
- recommended milestones & deliverables

## 1 — High level architecture (textual)

Client (React/Next) ↔ API (Node/Express or Nest, TypeScript) ↔ Services:

- Auth: Google OAuth (Gmail + Calendar scopes), HubSpot OAuth
- Data ingestion / RAG:
  - Gmail importer (via Gmail API or Pub/Sub push)
  - HubSpot importer (contacts, notes)
  - Embed & store in Postgres + pgvector (vectors table)
- LLM service: OpenAI (or other LLM) for chat + embeddings
- Agent orchestration:
  - Tool wrappers for send_email, schedule_event, create_contact, get_events, hubspot_note, search_vector_store
  - Task orchestrator (Temporal or BullMQ) for long-running tasks that wait for replies
- Webhooks: Gmail (via Pub/Sub), HubSpot (webhooks), Google Calendar notifications or polling
- Database: Postgres (+pgvector extension), Redis (for job queue), Vault/KMS for secrets
- Frontend: Chat UI (chat-like, supports tool suggestions & cards)

---

## 2 — Tech stack & libs (TypeScript centric)

### Backend

- Node + TypeScript
- Framework: NestJS or Express (Nest preferred for structured DI)
- Google APIs: googleapis
- HubSpot: @hubspot/api-client
- LLM & embeddings: openai (or other provider SDK)
- DB: Postgres with pg (pgvector extension)
- ORM: Prisma (works well with Postgres + custom pgvector usage) or TypeORM
- Queue / durable workflows:
  - Option A (recommended): Temporal (durable workflows, retries, long waits)
  - Option B: BullMQ + Redis (simpler)
- Webhook listener: Express routes with strict verification
- Background workers: node worker processes
- Deployment: Vercel (frontend), Fly/App Engine/AWS/GCP for backend + Cloud SQL for Postgres

### Frontend

- React + TypeScript (Next.js optional)
- Chat UI: customizable chat component with streaming LLM responses and tool-cards

### Devops / Infra

- Postgres w/ pgvector extension
- Redis (for sessions/queue)
- Secrets in Vault/GCP Secret Manager/AWS Secrets Manager
- HTTPS + CORS
- Monitoring: Sentry + Prometheus

---

## 3 — OAuth scopes & steps (Google + HubSpot)

### Google OAuth (what to request)

When creating the OAuth client in Google Cloud Console:

#### Requested OAuth scopes:

- `openid`
- `email`
- `profile`
- Gmail:
  - `https://www.googleapis.com/auth/gmail.readonly` or `https://www.googleapis.com/auth/gmail.modify` (read/write). Since you need to send and create labels/mark read, request gmail.modify (read/write).
- Calendar:
  - `https://www.googleapis.com/auth/calendar.events` (read/write events)
  - `https://www.googleapis.com/auth/calendar.events.readonly` (if only read)
- If using push notifications via Gmail Pub/Sub, you’ll need Pub/Sub permissions set up in GCP project.

#### Exactly how to add test user webshookeng@gmail.com:

1. Create OAuth consent screen in Google Cloud Console (External).
2. In the “Test users” section, add `webshookeng@gmail.com`.
3. Save and publish to testing (still requires verification for sensitive scopes if you go beyond testing or to production).
4. Create OAuth 2.0 Client ID (type: Web application) and set redirect URIs to your app (e.g., `https://app.example.com/api/oauth/google/callback`).

Note: For development/testing, adding that email as a test user is sufficient to sign in with the app.

### HubSpot OAuth

- Create an app in HubSpot Developer Dashboard.
- Request scopes:
  - crm.objects.contacts.read
  - crm.objects.contacts.write
  - crm.objects.notes.read / crm.objects.notes.write
  - crm.schemas.contacts.read
  - crm.associations.read/write if needed
- Add redirect URI: https://app.example.com/api/oauth/hubspot/callback
- Use the HubSpot OAuth flow; user authorizes; you store refresh/access tokens.

## 4 — Database design (Postgres + pgvector)

Use Postgres with pgvector extension to store embeddings and retrieval metadata.

Key tables (simplified)

```sql
-- users
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  google_id text,
  hubspot_account_id text,
  created_at timestamptz DEFAULT now()
);

-- oauth_tokens
CREATE TABLE oauth_tokens (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  provider text NOT NULL, -- 'google' or 'hubspot'
  access_token text,
  refresh_token text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- documents (emails, notes, transcripts)
CREATE TABLE documents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  source text, -- 'gmail' or 'hubspot'
  source_id text, -- messageId or hubspot note id
  subject text,
  snippet text,
  content text, -- full text
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- vectors (pgvector)
CREATE TABLE vectors (
  id serial PRIMARY KEY,
  document_id uuid REFERENCES documents(id),
  embedding VECTOR(1536), -- depends on embedding dim
  chunk_index int,
  created_at timestamptz DEFAULT now()
);

-- tasks (queued/ongoing tasks created by agent)
CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  type text, -- 'schedule_meeting', 'send_email', ...
  payload jsonb,
  status text, -- 'pending', 'in_progress', 'waiting_for_response', 'completed', 'failed'
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- memory/instructions (ongoing instructions)
CREATE TABLE memories (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  type text, -- 'rule' or 'short-term' etc
  text text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## 5 — Ingestion & RAG pipeline

### 1) Gmail ingestion

Options:

- Push (recommended for real-time): Configure Gmail watch endpoint -> push to GCP Pub/Sub -> forward to your webhook worker. Requires setting up Pub/Sub in the Google Cloud project that owns the Gmail credentials. Worker pulls message IDs and uses Gmail API to fetch full messages and parse.
- Polling (simpler): Poll the Gmail messages.list endpoint periodically for new messages.

Process:

- Fetch message -> parse headers, body, attachments -> normalize to plain text
- Chunk long messages into smaller pieces (e.g., 500–1000 tokens chunks) with metadata (messageId, threadId, sender, date)
- Create embeddings per chunk (OpenAI embeddings or other)
- Store chunks in documents and vectors (pgvector)

### 2) HubSpot ingestion

- Use HubSpot API to fetch contacts, contact properties, notes/engagements, companies
- For each contact/note: create a documents row and embedding + vectors
- Also store HubSpot IDs in metadata for fast lookup

### 3) RAG retrieval

- For any user query:
  - Embed the query
  - Run approximate nearest-neighbor search against vectors (pgvector supports ivfflat, hnsw, etc.)
  - Retrieve top-k contextual chunks (with metadata)
  - Build the prompt: system instructions + retrieved context + tools + user query
  - Call LLM with tool-calling enabled (see next section)

---

## 6 — Agent: tools, prompts & tool calling

Design the agent as an LLM orchestrator that can call predefined tools. Tools are thin wrappers over the real APIs; they should be deterministic and idempotent when possible.

#### Example tool set

- `search_contacts(query)` → search HubSpot contacts + RAG search on documents
- `get_contact(contact_id_or_name)` → return contact details
- `create_contact({email, name, metadata})`
- `add_contact_note(contact_id, note)`
- `send_email({to, subject, body, threadId?})`
- `propose_meeting_times(userId, availability_window, duration)` → consult Google Calendar freebusy and return options
- `create_calendar_event({attendees, start, end, description})`
- `update_task(task_id, status, result)`
- `query_calendar(range) → list events`
- `search_documents(query, k)`

#### Tool calling design

- Use an LLM that supports tool calls (or emulate with structured JSON output validated by the backend).
- When the model returns a tool call, the backend executes the tool, records outputs (in tasks or documents) and then returns tool results back to the LLM to continue the chain.
- For long-running interactions (waiting for an email reply), create a task in DB and a durable workflow (Temporal/BullMQ) to:
  - wait for webhook that matches threadId/from address
  - resume the workflow, call the LLM with new context, perform follow-up actions 
  
#### Example flow: “Schedule an appointment with Sara Smith”

1. User: "Schedule an appointment with Sara Smith."
2. LLM: calls search_contacts("Sara Smith") — returns HubSpot contact (email).
3. LLM: calls propose_meeting_times(userId, 3 days, 30m) → backend checks calendar freebusy and returns 3 slots.
4. LLM: decides to email Sara with available times and send as a meeting request or propose times. Calls send_email({to: sara@example.com, subject, body}). Save threadId and create task with status waiting_for_response.
5. When webhook receives reply on same thread, the workflow resumes: parse reply, LLM decides next action (create event, ask for more times), call create_calendar_event and add_contact_note, update HubSpot and mark task completed. Each step logged.

---

## 7 — Memory & ongoing instructions

Two memory types:

- Long-term rules (user-provided instructions): store in memories table as structured rules. System prompt includes these.
- Short-term working memory: per-conversation or per-task context.

When a webhook arrives (new email, calendar event, hubspot event):

- The webhook handler:
  1. loads user’s memories and recent relevant RAG context
  2. embeds event and stores documents/vectors
  3. invokes the "proactive-check" LLM prompt, e.g.: “A new email arrived from X; consider user rules and tools; propose actions.” The LLM may produce tool calls (e.g., create contact if not exist)

You must not hardcode scenarios; the LLM should be able to use tools and stored instructions to decide.

---

## 8 — Webhooks vs Polling & real-time details

Gmail:

- Best: Gmail push notifications using watch -> Pub/Sub -> your backend. Pros: immediate. Cons: more setup (Pub/Sub with permissions).
- Fallback: poll periodically using messages.list with q parameter and labelIds to restrict.

Calendar:

- Calendar push notifications available, or poll.

HubSpot:

- HubSpot has webhooks for contact creation/engagements; configure webhook URL in your HubSpot app.

**Recommendation**: Use webhooks for HubSpot and Calendar where possible; for Gmail use Pub/Sub push if you can manage GCP settings, otherwise polling.

---

## 9 — Durable tasks and waiting for replies

I strongly recommend a durable workflow engine (Temporal recommended) for tasks that may wait hours or days:

- Start workflow on action (send email proposing times).
- Workflow schedules a timer, waits on event (e.g., webhook match for the thread id).
- On event, workflow resumes and continues logic (LLM call + tool calls).
- Temporal gives retries, visibility, and persistence.

Alternative simpler approach: store task in DB and have a worker loop that checks tasks and events; less robust but doable.

---

## 10 — Sample TypeScript snippets

Below are concise examples to help you get started. These are illustrative — you’ll wire them into Nest/Express and add error handling, logging, testing.

### A) Google OAuth route (Express + googleapis)

```ts
// src/routes/googleOauth.ts
import express from 'express';
import {google} from 'googleapis';
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/api/oauth/google/callback`
);

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events'
];

router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const code = req.query.code as string;
  const {tokens} = await oauth2Client.getToken(code);
  // store tokens for user in DB (oauth_tokens)
  // create or link user by email
  res.send('Google OAuth success, you can close this window.');
});

export default router;
```

### B) HubSpot OAuth (Express)

```ts
// src/routes/hubspotOauth.ts
import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

router.get('/hubspot', (req, res) => {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirect = `${process.env.APP_URL}/api/oauth/hubspot/callback`;
  const url = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20crm.schemas.contacts.read`;
  res.redirect(url);
});

router.get('/hubspot/callback', async (req, res) => {
  const code = req.query.code as string;
  const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      redirect_uri: `${process.env.APP_URL}/api/oauth/hubspot/callback`,
      code
    })
  });
  const tokens = await tokenRes.json();
  // store tokens
  res.send('HubSpot OAuth success.');
});
export default router;
```

### C) Simple tool wrapper: send_email

```ts
// src/tools/sendEmail.ts
import {google} from 'googleapis';
import base64url from 'base64url';

export async function sendGmail(userId: string, accessToken: string, to: string, subject: string, body: string, threadId?: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({access_token: accessToken});
  const gmail = google.gmail({version:'v1', auth: oauth2Client});
  const raw = [
    `From: me`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body
  ].join('\r\n');
  const encoded = base64url.encode(raw);
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encoded,
      threadId
    }
  });
  return res.data;
}
```

### D) Ingest Gmail message -> chunk -> embed -> store (pseudo)

```ts
// src/ingest/gmailIngest.ts
import {google} from 'googleapis';
import {embedText} from '../llm/embeddings'; // wrapper for OpenAI embeddings
import {upsertDocumentAndVectors} from '../db/vectorStore';

export async function ingestMessage(accessToken: string, messageId: string, userId: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({access_token: accessToken});
  const gmail = google.gmail({version:'v1', auth: oauth2Client});
  const msg = await gmail.users.messages.get({userId:'me', id: messageId, format:'full'});
  const text = extractPlainTextFromMessage(msg.data); // implement
  const chunks = chunkText(text, 800); // chunk size in tokens or chars
  for (let i=0;i<chunks.length;i++){
    const emb = await embedText(chunks[i]);
    await upsertDocumentAndVectors(userId, messageId, msg.data.snippet || '', chunks[i], emb, {chunk_index: i});
  }
}
```

---

## 11 — Prompting & system messages

Base system prompt should include:

- User's preferences and long-term memories (from memories table)
- Tool spec for the LLM (what each tool does, inputs/outputs)
- Retrieval context (top-k RAG chunks)
- Safety and compliance instructions (no PII hallucination; ask to confirm before sending emails that include financial advice)

Example system instruction (short):

> You are an assistant for a financial advisor. Use the provided client documents and HubSpot data to answer queries and call tools exactly as specified. If you call a tool, return only the tool name and a well-structured JSON of arguments. If you need to ask clarifying questions, ask them. Respect user rules stored in memory.

---

## 12 — Security & compliance

- Always encrypt tokens at rest (secrets manager or DB encryption).
- Least privilege for OAuth scopes. Only request needed scopes.
- Rate limit API calls to Gmail/HubSpot and LLM usage.
- Log actions for audit (who asked to send which email, timestamp).
- Provide UI for user to review/approve outbound messages if they want (safety mode).
- For production and broad user base, Google sensitive scope verification is required.

---

## 13 — Testing & QA

**Unit & integration tests**

- Mock Google & HubSpot APIs (use nock)
- Test RAG retrieval correctness (fixture docs)
- End-to-end simulated flows: “Schedule meeting” where webhook replies are simulated by posting to webhook route

**Staging**

- Create test Google project and HubSpot test account
- Add webshookeng@gmail.com as OAuth test user (as requested)

**Manual checks**

- Ensure agent can:
  - answer factoids pulled from Gmail + HubSpot
  - create contact on receiving email from unknown sender
  - schedule meetings via proposed slots + handle reply flows

---

## 14 — Deliverables & milestones (example)

### Phase 1 — Foundations (1–2 weeks)

- Project skeleton (TypeScript backend, React frontend)
- Google OAuth + HubSpot OAuth flows working (add test user webshookeng@gmail.com)
- Postgres + pgvector setup
- Basic ingestion worker: import HubSpot contacts and list Gmail messages (polling)
- Simple chat UI that can do RAG retrieval and answer queries

### Phase 2 — Tools & agent (2–3 weeks)

- Implement tool wrappers (send_email, create_contact, create_event)
- LLM tool calling loop + chain-of-thought-free prompting
- Task DB + simple queue for waiting tasks

### Phase 3 — Durability & webhooks (2–3 weeks)

- Webhooks / PubSub integration (Gmail push optional)
- Durable workflows (Temporal) for long-running tasks
- Memory rules UI for “ongoing instructions”

### Phase 4 — polish & security (1–2 weeks)

- UX polish, approvals, logging, testing, deploy

---

## 15 — Example user stories & acceptance criteria

- **Login**: User can login via Google; test user webshookeng@gmail.com can authenticate.
- **Connect HubSpot**: User connects HubSpot and the app can fetch contacts.
- **RAG Q**: User asks “Who mentioned their kid plays baseball?” — agent searches embeddings from emails + notes and returns matches with source links.
- **Action Q**: User asks “Schedule appointment with Sara Smith” — agent finds Sara, proposes times, emails her, waits for reply, then creates calendar event and HubSpot note when confirmed.
- **Rule**: User says “When someone emails me that is not in HubSpot, please create a contact” → when a new email comes in, a contact is created and note is added.

---

## 6 — Additional implementation notes & tradeoffs

- `Embeddings provider`: OpenAI is simple; you could use a local embeddings model for privacy.
- `LLM hallucinations`: Use RAG + citation of sources (include metadata like message date and link).
- `Privacy`: If you can't host client emails in 3rd-party LLM provider, run embeddings locally or use private LLM.
- `Scaling`: Use vector index options (pgvector HNSW) or external vector DB (Pinecone/Weaviate) if you outgrow Postgres.

--- 


