import { redirect } from "next/navigation";
import { verifySession } from "../lib/session";
import SignupForm from "../ui/signup-form";
import Link from "next/link";

export default async function Signup() {
  const session = await verifySession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="h-screen text-lg flex flex-col items-center justify-center gap-5">
      <SignupForm />
      <p className="text-center">Already have an account? <Link href="/login" className="text-blue-500">Log in</Link></p>
    </main>
  );
}
