import { verifySession } from "./lib/session";
import Navbar from "./ui/navbar";
import TodoForm from "./ui/todo-form";
import Todos from "./ui/todos";
import Link from "next/link";

export default async function Home() {
  const session = await verifySession();

  return (
    <main className="h-screen text-lg">
      { session
        ? <div className="grid gap-5">
            <Navbar username={session.username} />
            <div className="container grid gap-2 mx-auto p-2">
              <Todos />
              <TodoForm />
            </div>
          </div>
        : <div className="flex justify-center items-center gap-5 p-5">
            <Link href="/login" className="text-2xl text-blue-600 hover:underline">Login</Link>
            <Link href="/signup" className="text-2xl text-blue-600 hover:underline">Signup</Link>
          </div>
      }
    </main>
  );
}
