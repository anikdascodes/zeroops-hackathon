import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Zerops Academy — Learn Cloud. Deploy Fast.',
  description: 'Interactive animated Zerops lessons with quizzes and a leaderboard, deployed on Zerops itself.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
