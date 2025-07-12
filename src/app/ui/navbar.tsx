"use client";

import React, { useState } from "react";
import Button from "./button";
import { logout } from "../actions/auth";

type NavbarProps = {
  username: string,
};

export default function Navbar({ username }: NavbarProps) {
  const [pending, setPending] = useState(false);

  return (
    <nav className="flex justify-between px-4 py-3 max-sm:px-1 bg-indigo-700">
      <h1 className="text-3xl max-sm:text-xl font-semibold">{username}</h1>
      <Button
        type="submit"
        onClick={() => {
          setPending(true);
          logout();
        }}
        className={`text-xl max-sm:text-sm p-2 border-2 border-red-500 ${pending ? "border-red-600 hover:cursor-not-allowed" : "hover:border-red-600 hover:cursor-pointer"}`}
        showSpinner={pending}
      >
        { pending ? "Logging out..." : "Log out" }
      </Button>
    </nav>
  );
}
