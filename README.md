# Hackaton

AI Career Advisor web app for Indian students built with Next.js.

The app collects student profile details through a structured form, generates a career report using AI providers, and displays the final report in text format on a separate page.

## Features

- Professional one-screen intake form UI
- AI provider fallback support
  - Gemini first (if key is configured)
  - Cohere fallback (if key is configured)
- Strict server-side JSON validation before response
- Human-readable report rendering on the result page

## Tech Stack

- Next.js App Router (TypeScript)
- Google Generative AI SDK
- Cohere Chat API (via fetch)

## Project Structure

- `app/page.tsx`: Student details form page
- `app/report/page.tsx`: Text report output page
- `app/api/career-report/route.ts`: AI generation API route
- `app/page.module.css`: Main form UI styles
- `app/report/report.module.css`: Report page styles

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` in project root

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

COHERE_API_KEY=your_cohere_api_key_here
COHERE_MODEL=command-a-03-2025
```

Notes:

- Configure at least one provider key
- `GEMINI_MODEL` and `COHERE_MODEL` are optional overrides

3. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## How It Works

1. User fills details on the home page.
2. Frontend sends `user_data` to `POST /api/career-report`.
3. API route builds a structured prompt and tries configured providers.
4. Response is parsed and validated against expected schema.
5. Frontend redirects to `/report` and shows a clean text report.

## API

Endpoint:

- `POST /api/career-report`

Request body:

```json
{
  "user_data": "Student profile text or JSON"
}
```

Success response:

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

## Troubleshooting

- 500 with model not found:
  - Update model name in `.env.local` or remove override and use fallback defaults.
- 500 with provider failure:
  - Verify API key is active and has model access.
  - Restart dev server after changing environment variables.
- Build says another next build is running:
  - Wait for the previous build to finish, then rerun.

## Security

- Never commit real API keys.
- Keep secrets only in `.env.local`.
- Rotate any key that was shared publicly.
