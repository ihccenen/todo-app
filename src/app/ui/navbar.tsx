"use client";

import { useTransition } from "react";
import Button from "./button";
import { logout } from "../actions/auth";

type NavbarProps = {
  username: string,
};

export default function Navbar({ username }: NavbarProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <nav className="flex justify-between px-4 py-3 max-sm:px-1 border-b-3 border-neutral-700">
      <h1 className="text-3xl max-sm:text-xl font-semibold">{username}</h1>
      <Button
        type="button"
        onClick={() => startTransition(async () => logout())}
        className={`text-xl max-sm:text-sm p-2 border-1 border-red-500 ${isPending ? "border-red-600 hover:cursor-not-allowed" : "hover:border-red-600 hover:cursor-pointer"}`}
        isPending={isPending}
      >
        { isPending ? "Logging out..." : "Log out" }
      </Button>
    </nav>
  );
}
