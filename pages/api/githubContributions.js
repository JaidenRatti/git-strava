// pages/api/githubContributions.js

import axios from "axios";

export default async function handler(req, res) {
  const { githubUsername } = req.query;

  if (!githubUsername) {
    return res.status(400).json({ error: "GitHub username is required" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "GitHub token is not set" });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  const query = `
    query {
      user(login: "${githubUsername}") {
        contributionsCollection(from: "${startDate.toISOString()}", to: "${endDate.toISOString()}") {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );

    const contributions = {};
    const weeks = response.data.data.user.contributionsCollection.contributionCalendar.weeks;

    weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        const date = new Date(day.date);
        const dateKey = date.toISOString().split("T")[0]; 
        contributions[dateKey] = day.contributionCount;
      });
    });

    return res.status(200).json(contributions);
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return res.status(500).json({ error: "Failed to fetch GitHub contributions" });
  }
}
