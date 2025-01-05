import "./globals.css";
import SessionProviderWrapper from "./SessionProviderWrapper";

export const metadata = {
  title: "Strava Activity Graph",
  description: "View your Strava activities in a GitHub-style contribution graph.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  ); 
}
