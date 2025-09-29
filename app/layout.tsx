import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import ToastProvider from "@/components/ToastProvider";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Review Platform",
  description: "Resume Review Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Header */}
        <Header />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

async function Header() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const isAuthed = Boolean(data.user);

  let userRole = null;
  if (isAuthed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .maybeSingle();
    userRole = profile?.role;
  }

  return (
    <header className="container" style={{ paddingBottom: "2" }}>
      <nav
        className="flex items-center justify-between"
        style={{ gap: "0.5rem" }}
      >
        <div className="flex items-center" style={{ gap: "0.5rem" }}>
          <Link className="btn" href="/">
            Home
          </Link>
          {isAuthed && userRole === "user" && (
            <Link className="btn" href="/dashboard">
              Dashboard
            </Link>
          )}
          {isAuthed && userRole === "admin" && (
            <Link className="btn" href="/admin">
              Admin Panel
            </Link>
          )}
        </div>
        <div>
          {isAuthed ? (
            <form action={logoutAction}>
              <button className="btn" type="submit">
                Logout
              </button>
            </form>
          ) : (
            <Link className="btn" href="/login">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
