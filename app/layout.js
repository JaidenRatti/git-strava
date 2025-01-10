import "./globals.css";
import SessionProviderWrapper from "./SessionProviderWrapper";
import { Analytics } from "@vercel/analytics/react"


export const metadata = {
  title: "Strava x GitHub Activity Graph",
  description: "GitHub contribution style view for Strava and Github activity",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}
        <Analytics/>
        </SessionProviderWrapper>
      </body>
    </html>
  );   
}
