import { redirect } from "next/navigation";
import { verifySession } from "../lib/session";
import LoginForm from "../ui/login-form";
import Link from "next/link";

export default async function Login() {
  const session = await verifySession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="h-screen text-lg flex flex-col items-center justify-center gap-5">
      <LoginForm />
      <p className="text-center">Don't have an account yet? <Link href="/signup" className="text-blue-500">Sign up</Link></p>
    </main>
  );
}
