import { redirect } from "next/navigation";
import { verifySession } from "../lib/session";
import SignupForm from "../ui/signup-form";

export default async function Signup() {
  const session = await verifySession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="text-lg">
      <SignupForm />
    </main>
  );
}
