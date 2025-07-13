"use client";

import Input from "./input";
import Button from "./button";
import { login } from "../actions/auth";
import { useActionState } from "react";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="w-[22rem] flex flex-col px-5 py-10 gap-8 border-2 border-neutral-900 rounded-xl">
      <Input
        label={"Username"}
        name="username"
        id="username"
        pattern=".*"
        defaultValue={state?.formFields?.username}
        required={true}
      />
      <Input
        label={"Password"}
        type="password"
        name="password"
        id="password"
        pattern=".*"
        defaultValue={state?.formFields?.password}
        required={true}
      />
      <Button
        type="submit"
        disabled={pending}
        className={`text-xl mx-auto px-10 py-2 rounded-xl ${pending ? "bg-lime-700" : "bg-lime-600 hover:bg-lime-700 focus:bg-lime-700"}`}
        showSpinner={pending}
      >
        { pending ? "Logging in..." : "Log in" }
      </Button>
      { state?.errors?.server && <p className="text-center text-red-500">{state.errors.server}</p> }
    </form>
  );
}
