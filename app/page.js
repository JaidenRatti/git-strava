"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import axios from "axios";
import { useEffect, useState } from "react";
export default function Home() {
    const { data: session } = useSession();
    const [activities, setActivities] = useState([]);
    const [tooltip, setTooltip] = useState({ visible: false, day: "", hours: 0, x: 0, y: 0 });
  
    useEffect(() => {
      const fetchActivitiesForYear = async () => {
        if (!session?.accessToken) return;
  
        const startDate = new Date("2024-01-01").toISOString();
        const endDate = new Date("2024-12-31").toISOString();
        const allActivities = [];
        let page = 1;
  
        try {
          while (true) {
            const response = await axios.get(
              `https://www.strava.com/api/v3/athlete/activities?after=${new Date(
                startDate
              ).getTime() / 1000}&before=${new Date(endDate).getTime() / 1000}&per_page=100&page=${page}`,
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
  
    const generateActivityGraph = (activities) => {
      const activityMap = {};
    
      activities.forEach((activity) => {
        const date = new Date(activity.start_date).toISOString().split("T")[0];
        const hours = activity.moving_time / 3600;
        activityMap[date] = (activityMap[date] || 0) + hours;
      });
    
      const graphData = Array.from({ length: 7 }, () =>
        Array.from({ length: 52 }, () => ({ count: 0, date: null }))
      );
    
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
    
      let currentDate = new Date(startDate);
    
      for (let i = 0; i < 364; i++) {
        if (currentDate > endDate) break;
    
        const week = Math.floor(i / 7);
        const day = currentDate.getDay();
    
        const dateString = currentDate.toISOString().split("T")[0];
        graphData[day][week] = {
          count: activityMap[dateString] || 0,
          date: new Date(currentDate),
        };
    
        currentDate.setDate(currentDate.getDate() + 1);
      }
    
      return graphData;
    };
  
    const getColor = (count) => {
      if (count === 0) return "#ffffff";
      if (count < 1) return "#ffdcc2"; // Light orange
      if (count < 3) return "#ffb687"; // Medium orange
      if (count < 5) return "#ff8e50"; // Darker orange
      return "#ff5a1f"; // Dark orange
    };
  
    const activityGraph = generateActivityGraph(activities);
  
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          textAlign: "center",
          backgroundColor: "#fff3e4", // Main background color set here
          fontFamily: "'Inter', sans-serif",
          color: "#333",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>Strava Contributions</h1>
        {!session ? (
          <>
            <p style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
              View your Strava activities in a GitHub style contribution graph
            </p>
            <button
              onClick={() => signIn("strava")}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                color: "#fff",
                backgroundColor: "#f67721",
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
                backgroundColor: "#f67721",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "1.5rem",
              }}
            >
              Sign Out
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(52, 20px)",
                gridGap: "5px",
                justifyContent: "center",
                margin: "0 auto",
                position: "relative",
              }}
            >
              {activityGraph.map((week, dayIndex) =>
                week.map(({ count, date }, weekIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: getColor(count),
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      setTooltip({
                        visible: true,
                        day: date ? date.toDateString() : "No data",
                        hours: count.toFixed(1),
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseLeave={() => setTooltip({ visible: false })}
                  />
                ))
              )}
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
                  borderRadius: "5px",
                  padding: "5px 10px",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                  zIndex: 100,
                  fontSize: "0.9rem",
                }}
              >
                <p>{tooltip.day}</p>
                <p>{tooltip.hours} hours</p>
              </div>
            )}
          </div>
        )}
        <footer
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            display: "flex",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "#fff3e4",
          }}
        >
          <a href="https://www.strava.com/athletes/67811653" target="_blank" rel="noopener noreferrer">
            <img
              src="/strava.png"
              alt="Strava Logo"
              style={{
                width: "30px",
                height: "auto",
                margin: "0 15px",
              }}
            />
          </a>
          <a href="https://github.com/JaidenRatti" target="_blank" rel="noopener noreferrer">
            <img
              src="/github.svg"
              alt="GitHub Logo"
              style={{
                width: "30px",
                height: "auto",
                margin: "0 15px",
              }}
            />
          </a>
        </footer>
      </main>
    );
  }