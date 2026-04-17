"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

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

type StudentForm = {
  name: string;
  age: string;
  education: string;
  location: string;
  interests: string;
  skills: string;
  goals: string;
  constraints: string;
};

const starterForm: StudentForm = {
  name: "",
  age: "",
  education: "",
  location: "",
  interests: "",
  skills: "",
  goals: "",
  constraints: "",
};

function toList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState<StudentForm>(starterForm);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const profileData = {
    name: formData.name.trim(),
    age: formData.age.trim() === "" ? "" : Number(formData.age),
    education: formData.education.trim(),
    location: formData.location.trim(),
    interests: toList(formData.interests),
    skills: toList(formData.skills),
    goals: toList(formData.goals),
    constraints: toList(formData.constraints),
  };

  const profileJson = JSON.stringify(profileData, null, 2);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/career-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_data: profileJson }),
      });

      const data = (await response.json()) as CareerReport | { error?: string; details?: string };

      if (!response.ok || "error" in data) {
        const message = "error" in data && data.error ? data.error : "Failed to generate report.";
        const details = "details" in data && data.details ? ` ${data.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      const reportData = data as CareerReport;
      sessionStorage.setItem("careerReport", JSON.stringify(reportData));
      router.push("/report");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.panel}>
          <div className={styles.header}>
            <h1>AI Career Advisor for Indian Students</h1>
            <p className={styles.subtitle}>
              Fill details and generate a role-matched report with roadmap and skill gaps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Student name"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  value={formData.age}
                  onChange={(event) => setFormData((prev) => ({ ...prev, age: event.target.value }))}
                  placeholder="20"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="education">Education</label>
                <input
                  id="education"
                  value={formData.education}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, education: event.target.value }))
                  }
                  placeholder="B.Tech CSE, 2nd year"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, location: event.target.value }))
                  }
                  placeholder="Pune"
                  required
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="interests">Interests</label>
                <textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, interests: event.target.value }))
                  }
                  rows={3}
                  placeholder="coding, UI design, data analysis"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="skills">Current Skills</label>
                <textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, skills: event.target.value }))
                  }
                  rows={3}
                  placeholder="python basics, html, sql basics"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="goals">Career Goals</label>
                <textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(event) => setFormData((prev) => ({ ...prev, goals: event.target.value }))}
                  rows={3}
                  placeholder="internship in 6 months, full-time job after graduation"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="constraints">Constraints</label>
                <textarea
                  id="constraints"
                  value={formData.constraints}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, constraints: event.target.value }))
                  }
                  rows={3}
                  placeholder="budget-friendly learning, beginner level"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </form>

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
