import { logout } from "../actions/auth";
import React from "react";

type NavbarProps = {
  username: string,
};

export default function Navbar({ username }: NavbarProps) {
  return (
    <nav className="flex justify-between px-4 py-3 bg-indigo-700">
      <h1 className="text-3xl font-semibold">{username}</h1>
      <form action={logout}>
        <button type="submit" className="text-xl p-1 rounded-md bg-fuchsia-500 hover:bg-fuchsia-600 focus:bg-fuchsia-600 hover:cursor-pointer">Logout</button>
      </form>
    </nav>
  );
}
