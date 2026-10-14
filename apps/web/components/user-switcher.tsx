"use client";

import { useTransition } from "react";
import { switchUser } from "@/app/actions";
import type { User } from "@/lib/types";

// Demo stand-in for Google sign-in: pick who you are acting as.
export function UserSwitcher({ users, currentId }: { users: User[]; currentId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Acting as
      <select
        className="h-8 rounded-md border bg-background px-2 text-foreground"
        value={currentId}
        disabled={pending}
        onChange={(e) => startTransition(() => switchUser(e.target.value))}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </label>
  );
}
