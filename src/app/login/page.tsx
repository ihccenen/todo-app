import { redirect } from "next/navigation";
import { verifySession } from "../lib/session";
import LoginForm from "../ui/login-form";

export default async function Login() {
  const session = await verifySession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="text-lg">
      <LoginForm />
    </main>
  );
}
