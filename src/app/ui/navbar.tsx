"use client";

import { useState } from "react";
import Button from "./button";
import { logout } from "../actions/auth";

type NavbarProps = {
  username: string,
};

export default function Navbar({ username }: NavbarProps) {
  const [pending, setPending] = useState(false);

  return (
    <nav className="flex justify-between px-4 py-3 max-sm:px-1 border-b-3 border-neutral-700">
      <h1 className="text-3xl max-sm:text-xl font-semibold">{username}</h1>
      <Button
        type="button"
        onClick={() => {
          setPending(true);
          logout()
            .then(() => setPending(false))
            .catch(() => setPending(false));
        }}
        className={`text-xl max-sm:text-sm p-2 border-1 border-red-500 ${pending ? "border-red-600 hover:cursor-not-allowed" : "hover:border-red-600 hover:cursor-pointer"}`}
        isPending={pending}
      >
        { pending ? "Logging out..." : "Log out" }
      </Button>
    </nav>
  );
}
