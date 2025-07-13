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
        ? <div className="grid gap-5 pb-5">
            <Navbar username={session.username} />
            <div className="container grid gap-2 p-2 mx-auto">
              <TodoForm />
              <Todos />
            </div>
          </div>
        : <div className="h-full text-3xl text-blue-500 flex justify-center items-center gap-5 p-5">
            <Link href="/login" className="p-5 border-1 border-neutral-800 hover:bg-neutral-700 rounded-xl hover:underline">Log in</Link>
            <Link href="/signup" className="p-5 border-1 border-neutral-800 hover:bg-neutral-700 rounded-xl hover:underline">Sign up</Link>
          </div>
      }
    </main>
  );
}
