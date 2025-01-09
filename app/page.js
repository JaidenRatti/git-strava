"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState([]);
  const [githubContributions, setGithubContributions] = useState({});
  const [githubUsername, setGithubUsername] = useState("");
  const [tooltip, setTooltip] = useState({
    visible: false,
    day: "",
    stravaHours: 0,
    githubContributions: 0,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const fetchActivitiesForYear = async () => {
      if (!session?.accessToken) return;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const allActivities = [];
      let page = 1;

      try {
        while (true) {
          const response = await axios.get(
            `https://www.strava.com/api/v3/athlete/activities?after=${startDate.getTime() / 1000}&before=${endDate.getTime() / 1000}&per_page=100&page=${page}`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
            }
          );

          if (response.data.length === 0) break;

          allActivities.push(...response.data);
          page += 1;
        }

        setActivities(allActivities);
      } catch (error) {
        console.error("Error fetching Strava activities:", error);
      }
    };

    fetchActivitiesForYear();
  }, [session]);

  const fetchGithubContributions = async () => {
    try {
      const response = await axios.get(`/api/githubContributions?githubUsername=${githubUsername}`);
      setGithubContributions(response.data);  // Set the data received from the API
    } catch (error) {
      console.error("Error fetching GitHub contributions", error);
    }
  };
  


  // Generate activity graph with correct date formatting
  const generateActivityGraph = (activities, githubContributions) => {
    const activityMap = {};

    activities.forEach((activity) => {
      const date = new Date(activity.start_date).toISOString().split("T")[0];
      const hours = activity.moving_time / 3600;
      activityMap[date] = (activityMap[date] || 0) + hours;
    });

    const graphData = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    let currentDate = new Date(startDate);

    for (let i = 0; i < 364; i++) {
      if (currentDate > endDate) break;

      const dateString = currentDate.toISOString().split("T")[0];
      graphData.push({
        stravaCount: activityMap[dateString] || 0,
        githubCount: githubContributions[dateString] || 0,
        date: new Date(currentDate),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return graphData;
  };

  const getColor = (stravaCount, githubCount) => {
    if (stravaCount === 0 && githubCount === 0) return "#ebedf0"; // GitHub light gray

    if (stravaCount > 0 && githubCount > 0) {
      return `linear-gradient(to bottom right, #6cc644 ${(githubCount / (githubCount + stravaCount)) * 100}%, #ff5a1f)`;
    }

    if (githubCount > 0) {
      if (githubCount < 5) return "#9be9a8"; // Light green
      if (githubCount < 10) return "#40c463"; // Medium green
      if (githubCount < 20) return "#30a14e"; // Darker green
      return "#216e39"; // Darkest green
    }

    if (stravaCount > 0) {
      if (stravaCount < 1) return "#ffdcc2";
      if (stravaCount < 3) return "#ffb687";
      if (stravaCount < 5) return "#ff8e50";
      return "#ff5a1f";
    }
  };

  const activityGraph = generateActivityGraph(activities, githubContributions);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#fff3e4",
        fontFamily: "'Inter', sans-serif",
        color: "#333",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>Strava + GitHub Contributions</h1>
      {!session ? (
        <>
          <p style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
            View your Strava and GitHub contributions in one graph
          </p>
          <button
            onClick={() => signIn("strava")}
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              color: "#fff",
              backgroundColor: "#fc5100",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Connect with Strava
          </button>
        </>
      ) : (
        <div style={{ width: "90%", maxWidth: "1000px", marginTop: "2rem" }}>
          <button
            onClick={signOut}
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              color: "#fff",
              backgroundColor: "#fc5100",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginBottom: "1.5rem",
            }}
          >
            Sign Out
          </button>
          <input
            type="text"
            placeholder="Enter your GitHub username"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "1rem",
              marginBottom: "1rem",
              border: "1px solid #ddd",
              borderRadius: "5px",
              width: "100%",
            }}
          />
          <button
            onClick={fetchGithubContributions}
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              color: "#fff",
              backgroundColor: "#6cc644",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginBottom: "1.5rem",
            }}
          >
            Fetch GitHub Contributions
          </button>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(52, 20px)", // 52 columns for each week
              gridTemplateRows: "repeat(7, 20px)", // 7 rows for each day of the week
              gridGap: "5px", // Space between squares
              justifyContent: "center",
              margin: "0 auto",
              position: "relative",
            }}
          >
            {activityGraph.map(({ stravaCount, githubCount, date }, index) => {
              const column = Math.floor(index / 7); // Determine the column based on index
              const row = index % 7; // Determine the row (0 to 6, representing days of the week)

              return (
                <div
                  key={index}
                  style={{
                    width: "20px",
                    height: "20px",
                    background: getColor(stravaCount, githubCount),
                    borderRadius: "3px",
                    cursor: "pointer",
                    gridColumnStart: column + 1, // Start at the correct column
                    gridRowStart: row + 1, // Start at the correct row
                  }}
                  onMouseEnter={(e) =>
                    setTooltip({
                      visible: true,
                      day: date ? date.toDateString() : "No data",
                      stravaHours: stravaCount,
                      githubContributions: githubCount,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setTooltip({ visible: false })}
                />
              );
            })}
          </div>

          <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
                fontSize: "0.9rem",
                color: "#666",
                width: "100%",
              }}
            >
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                (month, index) => (
                  <span
                    key={index}
                    style={{
                      width: "calc(100% / 12)",
                      textAlign: "center",
                      paddingTop: "15px",
                    }}
                  >
                    {month}
                  </span>
                )
              )}
            </div>

          {tooltip.visible && (
            <div
              style={{
                position: "absolute",
                top: tooltip.y + 10,
                left: tooltip.x + 10,
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                padding: "10px",
                borderRadius: "5px",
                fontSize: "0.9rem",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <strong>{tooltip.day}</strong>
              <br />
              Strava Hours: {tooltip.stravaHours.toFixed(1)}
              <br />
              GitHub Contributions: {tooltip.githubContributions}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
