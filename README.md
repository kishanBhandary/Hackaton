# AI Career Advisor (Gemini/Cohere + Next.js)

This app generates personalized career reports for Indian students using Google Gemini API with optional Cohere fallback.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add provider keys in `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
COHERE_API_KEY=your_cohere_api_key_here
COHERE_MODEL=command-a-03-2025
```

Use at least one provider key:
- `GEMINI_API_KEY` for Gemini
- `COHERE_API_KEY` for Cohere

Optional model overrides:
- `GEMINI_MODEL` (default fallback chain is used when omitted)
- `COHERE_MODEL` (default fallback chain is used when omitted)

3. Start development server:

```bash
npm run dev
```

Open http://localhost:3000

## How It Works

- Frontend input form: `app/page.tsx`
- Backend provider route: `app/api/career-report/route.ts`
- Prompt is simple, structured, and forces strict JSON output.

## API

Endpoint: `POST /api/career-report`

Request body:

```json
{
  "user_data": "Student profile text or JSON"
}
```

Response shape:

```json
{
  "strengths": [],
  "weaknesses": [],
  "careers": [
    {
      "name": "",
      "match_percentage": "",
      "reason": "",
      "required_skills": [],
      "skill_gaps": []
    }
  ],
  "top_career_roadmap": [
    {
      "week": "Week 1",
      "focus": "",
      "tasks": [],
      "project": ""
    }
  ],
  "projects": [],
  "resources": []
}
```
# Hackaton
