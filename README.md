# PANDA – EXIST Gründungsstipendium Planner

Internal planning and management dashboard for the EXIST Gründungsstipendium Vorhaben.

Team: Jiun & Nina

## Tech Stack

- Next.js 14 (App Router)
- Vanilla CSS
- Vercel deployment ready

## Getting Started

```bash
npm install
npm run dev
```

## Deploy to Vercel

Push to GitHub, import at [vercel.com/new](https://vercel.com/new), deploy.

Or via CLI:

```bash
npx vercel
```

## Topic images

In `/topics`, drop images into the editor or type `/image` and choose **Upload**.
JPEG, PNG, GIF, WebP, and AVIF images up to 4 MB are supported. Save the topic
after uploads finish to persist the image blocks in the document.

Images use the existing `BLOB_READ_WRITE_TOKEN` and private Vercel Blob store,
with authenticated image delivery through `/api/topics/images/[id]`.

## API Documentation for External AI Agents

PANDA exposes a set of APIs to allow external AI agents to query the project state and push updates autonomously. All API endpoints require authentication using a Bearer token.

### Authentication

Include the `PANDA_API_KEY` (configured in the environment) in the `Authorization` header for all requests:

```http
Authorization: Bearer <YOUR_PANDA_API_KEY>
```

### 1. Get Dashboard Data

**`GET /api/dashboard-data`**

Returns the full current project state in JSON format, including milestones, work packages, goals, sprints, notes, and budgets.

### 2. Push Updates

**`POST /api/update`**

Allows agents to mutate the project state. The body must be a JSON object containing `type`, `action`, and `data` fields. You can optionally include `agent` and `author`.

#### Update or Add Milestones

```json
// Add a milestone
{
  "type": "milestone",
  "action": "add",
  "data": {
    "title": "New Milestone Title",
    "date": "2026-10-15",
    "status": "upcoming"
  },
  "agent": "MyCustomAgent"
}

// Update a milestone status
{
  "type": "milestone",
  "action": "update",
  "data": {
    "title": "New Milestone Title",
    "status": "done"
  },
  "agent": "MyCustomAgent"
}
```

#### Update or Add Progress (Work Packages)

```json
// Add a work package
{
  "type": "progress",
  "action": "add",
  "data": {
    "id": "AP6",
    "name": "Beta Testing",
    "progress": 0,
    "owner": "Nina"
  }
}

// Update work package progress
{
  "type": "progress",
  "action": "update",
  "data": {
    "id": "AP1",
    "progress": 85
  }
}
```

#### Update or Add Budget

```json
// Add a budget item
{
  "type": "budget",
  "action": "add",
  "data": {
    "label": "Marketing",
    "amount": 5000,
    "pct": 3
  }
}

// Update a budget amount
{
  "type": "budget",
  "action": "update",
  "data": {
    "label": "Marketing",
    "amount": 8000
  }
}
```

#### Add Notes

```json
// Add a new project note
{
  "type": "note",
  "action": "add",
  "data": {
    "text": "Completed review of the financial projections."
  },
  "author": "Alice"
}
```

## Colab Notebook Viewer

Open **More → Notebook** to read the connected Colab notebook inside PANDA.
The viewer loads saved cells and outputs from Google Drive; use **Refresh notebook**
after saving changes in Colab. Editing, execution, and interactive widgets remain
available through **Open in Colab**. HTML outputs are isolated with scripts disabled.

The notebook must remain downloadable through its Google Drive sharing settings.
The fixed notebook source is configured in `src/app/api/notebook/route.js`, and its
Colab link is in `src/app/notebook/page.js`. No Google credentials are stored by PANDA.
The page and API use PANDA's existing authentication middleware.

## Source Structure

```
src/app/
  globals.css    Design system
  layout.js      Root layout
  page.js        Dashboard
```
