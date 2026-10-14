import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import { UserSwitcher } from "@/components/user-switcher";
import { api, DEFAULT_USER_ID, USER_COOKIE } from "@/lib/api";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Supplier Copilot",
  description: "Recommends the best supplier for each IT hardware purchase request.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const users = await api<User[]>("/users");
  const currentId = Number((await cookies()).get(USER_COOKIE)?.value ?? DEFAULT_USER_ID);

  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen bg-muted text-foreground antialiased">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <nav className="flex items-center gap-5">
              <Link href="/" className="font-semibold">
                Supplier Copilot
              </Link>
              <Link href="/requests" className="text-sm text-muted-foreground hover:text-foreground">
                Requests
              </Link>
              <Link href="/requests/new" className="text-sm text-muted-foreground hover:text-foreground">
                New request
              </Link>
            </nav>
            <UserSwitcher users={users} currentId={currentId} />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
