import Link from "next/link";

import Navbar from "./ui/navbar";
import { verifySession } from "./lib/session";

export default async function Home() {
  const session = await verifySession();

  return (
    <main className="h-screen text-lg">
      { session
        ? <div>
            <Navbar username={session.username} />
          </div>
        : <div className="flex justify-center items-center gap-5 p-5">
            <Link href="/login" className="text-2xl text-blue-600 hover:underline">Login</Link>
            <Link href="/signup" className="text-2xl text-blue-600 hover:underline">Signup</Link>
          </div>
      }
    </main>
  );
}
