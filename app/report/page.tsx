"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./report.module.css";

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

const emptyOutput: CareerReport = {
  strengths: [],
  weaknesses: [],
  careers: [],
  top_career_roadmap: [],
  projects: [],
  resources: [],
};

function linesFromList(items: string[]): string {
  if (items.length === 0) return "- None";
  return items.map((item) => `- ${item}`).join("\n");
}

function toTextReport(report: CareerReport): string {
  const careerLines =
    report.careers.length === 0
      ? "No careers generated yet."
      : report.careers
          .map(
            (career, index) =>
              `${index + 1}. ${career.name} (${career.match_percentage})\n` +
              `Reason: ${career.reason}\n` +
              `Required Skills:\n${linesFromList(career.required_skills)}\n` +
              `Skill Gaps:\n${linesFromList(career.skill_gaps)}`
          )
          .join("\n\n");

  const roadmapLines =
    report.top_career_roadmap.length === 0
      ? "No roadmap generated yet."
      : report.top_career_roadmap
          .map(
            (week) =>
              `${week.week}: ${week.focus}\nTasks:\n${linesFromList(week.tasks)}\nMini Project: ${week.project}`
          )
          .join("\n\n");

  return [
    "Career Report",
    "",
    "Top Strengths",
    linesFromList(report.strengths),
    "",
    "Top Weaknesses",
    linesFromList(report.weaknesses),
    "",
    "Recommended Careers",
    careerLines,
    "",
    "3-Month Roadmap (Top Career)",
    roadmapLines,
    "",
    "Project Ideas",
    linesFromList(report.projects),
    "",
    "Free Resources",
    linesFromList(report.resources),
  ].join("\n");
}

export default function ReportPage() {
  const [report] = useState<CareerReport>(() => {
    if (typeof window === "undefined") {
      return emptyOutput;
    }

    const stored = sessionStorage.getItem("careerReport");
    if (!stored) {
      return emptyOutput;
    }

    try {
      return JSON.parse(stored) as CareerReport;
    } catch {
      return emptyOutput;
    }
  });

  const textOutput = toTextReport(report);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.panel}>
          <div className={styles.header}>
            <h1>Output Text</h1>
            <Link href="/" className={styles.backLink}>
              Back to Form
            </Link>
          </div>

          <pre className={styles.output}>{textOutput}</pre>
        </section>
      </main>
    </div>
  );
}
