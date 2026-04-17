import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
].filter((name): name is string => Boolean(name && name.trim()));

const COHERE_MODEL_CANDIDATES = [
  process.env.COHERE_MODEL,
  "command-a-03-2025",
  "command-r-plus-08-2024",
  "command-r-08-2024",
].filter((name): name is string => Boolean(name && name.trim()));

type Career = {
  name: string;
  match_percentage: string;
  reason: string;
  required_skills: string[];
  skill_gaps: string[];
};

type RoadmapWeek = {
  week: string;
  focus: string;
  tasks: string[];
  project: string;
};

type CareerReport = {
  strengths: string[];
  weaknesses: string[];
  careers: Career[];
  top_career_roadmap: RoadmapWeek[];
  projects: string[];
  resources: string[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCareer(value: unknown): value is Career {
  if (!value || typeof value !== "object") return false;
  const data = value as Career;
  return (
    typeof data.name === "string" &&
    typeof data.match_percentage === "string" &&
    typeof data.reason === "string" &&
    isStringArray(data.required_skills) &&
    isStringArray(data.skill_gaps)
  );
}

function isRoadmapWeek(value: unknown): value is RoadmapWeek {
  if (!value || typeof value !== "object") return false;
  const data = value as RoadmapWeek;
  return (
    typeof data.week === "string" &&
    typeof data.focus === "string" &&
    isStringArray(data.tasks) &&
    typeof data.project === "string"
  );
}

function isCareerReport(value: unknown): value is CareerReport {
  if (!value || typeof value !== "object") return false;
  const data = value as CareerReport;
  return (
    isStringArray(data.strengths) &&
    isStringArray(data.weaknesses) &&
    Array.isArray(data.careers) &&
    data.careers.every(isCareer) &&
    Array.isArray(data.top_career_roadmap) &&
    data.top_career_roadmap.every(isRoadmapWeek) &&
    isStringArray(data.projects) &&
    isStringArray(data.resources)
  );
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) return codeFenceMatch[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function buildPrompt(userData: string): string {
  return `You are an advanced AI Career Advisor designed for Indian students.

Analyze the student profile and generate a complete personalized career report.

Student Profile:
${userData}

Tasks:
1. Identify top 5 strengths and top 5 weaknesses.
2. Recommend top 3 to 5 career paths based on skills, interests, and Indian job market demand.
3. For each career provide match percentage (0-100%), reason, required skills, and skill gaps.
4. For the top 1 career, generate a detailed 3-month roadmap with Week 1 to Week 12, including topics, tools/technologies, and mini projects.
5. Suggest 3 real-world project ideas and 3 free resources.

Rules:
- Be practical and realistic.
- Focus on job-ready skills.
- Avoid generic advice.
- Keep roadmap beginner-friendly but impactful.

Return ONLY valid JSON in this exact format:
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

If output is invalid JSON, regenerate and return only valid JSON.`;
}

async function generateWithGeminiFallback(
  genAI: GoogleGenerativeAI,
  prompt: string
): Promise<string> {
  let lastError: unknown = null;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? new Error(`All configured Gemini models failed. Last error: ${lastError.message}`)
    : new Error("All configured Gemini models failed.");
}

function readCohereText(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") return "";

  const data = responseJson as {
    text?: unknown;
    message?: { content?: Array<{ type?: string; text?: string }> };
  };

  if (typeof data.text === "string" && data.text.trim()) {
    return data.text;
  }

  const content = data.message?.content;
  if (Array.isArray(content)) {
    const textPart = content.find((item) => item?.type === "text" && typeof item.text === "string");
    if (textPart?.text) return textPart.text;
  }

  return "";
}

async function generateWithCohereFallback(prompt: string, cohereApiKey: string): Promise<string> {
  let lastError: unknown = null;

  for (const modelName of COHERE_MODEL_CANDIDATES) {
    try {
      const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cohereApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cohere ${modelName} failed: ${response.status} ${errorText}`);
      }

      const responseJson = (await response.json()) as unknown;
      const text = readCohereText(responseJson);

      if (!text.trim()) {
        throw new Error(`Cohere ${modelName} returned empty text.`);
      }

      return text;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? new Error(`All configured Cohere models failed. Last error: ${lastError.message}`)
    : new Error("All configured Cohere models failed.");
}

export async function POST(request: Request) {
  try {
    const { user_data } = (await request.json()) as { user_data?: string };

    if (!user_data || !user_data.trim()) {
      return NextResponse.json(
        { error: "Please provide student profile data in user_data." },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const cohereApiKey = process.env.COHERE_API_KEY;

    if (!geminiApiKey && !cohereApiKey) {
      return NextResponse.json(
        {
          error:
            "Missing provider keys. Set GEMINI_API_KEY or COHERE_API_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(user_data);
    let responseText = "";
    let providerError: unknown = null;

    if (geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        responseText = await generateWithGeminiFallback(genAI, prompt);
      } catch (error) {
        providerError = error;
      }
    }

    if (!responseText && cohereApiKey) {
      try {
        responseText = await generateWithCohereFallback(prompt, cohereApiKey);
      } catch (error) {
        providerError = error;
      }
    }

    if (!responseText) {
      const errorMessage =
        providerError instanceof Error
          ? providerError.message
          : "All configured AI providers failed.";
      return NextResponse.json(
        { error: "Failed to generate report.", details: errorMessage },
        { status: 500 }
      );
    }

    const jsonText = extractJson(responseText);
    const parsed = JSON.parse(jsonText) as unknown;

    if (!isCareerReport(parsed)) {
      return NextResponse.json(
        { error: "Model returned JSON with unexpected structure." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate report.", details: message },
      { status: 500 }
    );
  }
}