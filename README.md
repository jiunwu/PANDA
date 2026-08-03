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

## Structure

```
src/app/
  globals.css    Design system
  layout.js      Root layout
  page.js        Dashboard
```
