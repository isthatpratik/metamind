import "./globals.css";
import { Fustat } from "next/font/google";
import { UserProvider } from "@/contexts/UserContext";
import { ClientLayout } from "@/components/layout/ClientLayout";

const fustat = Fustat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fustat",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>MetaMind - AI Prompt Generator</title>
        <meta name="description" content="Generate powerful AI prompts with intelligent assistance" />
      </head>
      <body className={`${fustat.className} bg-black text-white min-h-screen flex flex-col`} suppressHydrationWarning>
        <UserProvider>
          <ClientLayout>{children}</ClientLayout>
        </UserProvider>
      </body>
    </html>
  );
}
