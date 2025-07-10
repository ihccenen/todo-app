"use client";

import { logout } from "../actions/auth";
import React from "react";

type NavbarProps = {
  username: string,
};

export default function Navbar({ username }: NavbarProps) {
  return (
    <nav className="flex justify-between px-4 py-3 max-sm:px-1 bg-indigo-700">
      <h1 className="text-3xl max-sm:text-xl font-semibold">{username}</h1>
      <button
        type="submit"
        onClick={() => logout()}
        className="text-xl max-sm:text-sm p-2 rounded-md bg-fuchsia-500 hover:bg-fuchsia-600 focus:bg-fuchsia-600 hover:cursor-pointer"
      >
        Logout
      </button>
    </nav>
  );
}
