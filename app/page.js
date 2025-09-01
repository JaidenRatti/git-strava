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
      setGithubContributions(response.data); 
    } catch (error) {
      console.error("Error fetching GitHub contributions", error);
    }
  };
  


  const generateActivityGraph = (activities, githubContributions) => {
    const activityMap = {};
  
    // Populate activityMap with activity hours
    activities.forEach((activity) => {
      const date = new Date(activity.start_date).toISOString().split("T")[0];
      const hours = activity.moving_time / 3600;
      activityMap[date] = (activityMap[date] || 0) + hours;
    });
  
    // Initialize graphData
    const graphData = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
  
    let currentDate = new Date(startDate);
  
    // Ensure we cover each day for a full year (52 weeks + a few extra days)
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      graphData.push({
        stravaCount: activityMap[dateString] || 0,
        githubCount: githubContributions[dateString] || 0,
        date: new Date(currentDate),
      });
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }
  
    // Group by weeks (Sunday as the first day of the week)
    const weeks = [];
    let week = [];
    graphData.forEach((entry) => {
      if (entry.date.getDay() === 0 && week.length > 0) {
        weeks.push(week);
        week = [];
      }
      week.push(entry);
    });
    if (week.length > 0) weeks.push(week); // Add the last week
  
    // Fill incomplete weeks at the start and end with placeholders
    const firstWeek = weeks[0];
    while (firstWeek.length < 7) {
      firstWeek.unshift({ date: null, stravaCount: 0, githubCount: 0 });
    }
  
    const lastWeek = weeks[weeks.length - 1];
    while (lastWeek.length < 7) {
      lastWeek.push({ date: null, stravaCount: 0, githubCount: 0 });
    }
  
    // Flatten the weeks array for rendering
    return weeks.flat();
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
      gridTemplateColumns: "repeat(52, minmax(20px, 20px))",
      gridTemplateRows: "repeat(7, minmax(14px, 20px))",
      gridGap: "3px",
      justifyContent: "center",
      margin: "0 auto",
      position: "relative",
      minWidth: "900px",
      maxWidth: "1200px"
    }}
  >
    {activityGraph.map(({ stravaCount, githubCount, date }, index) => {
      const weekIndex = Math.floor(index / 7);
      const dayOfWeek = index % 7;

      return (
        <div
          key={index}
          style={{
            width: "100%",
            height: "100%",
            background: date ? getColor(stravaCount, githubCount) : "#ebedf0",
            borderRadius: "4px",
            cursor: date ? "pointer" : "default",
            gridColumnStart: weekIndex + 1,
            gridRowStart: dayOfWeek + 1,
          }}
          onMouseEnter={(e) =>
            date &&
            setTooltip({
              visible: true,
              day: date.toDateString(),
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
