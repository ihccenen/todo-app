"use client";

import Input from "./input";
import { login } from "../actions/auth";
import { useActionState } from "react";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="max-w-sm flex flex-col gap-8 p-5 mx-auto">
      <Input
        label={"Username"}
        name="username"
        id="username"
        pattern="*"
        defaultValue={state?.formFields?.username}
        required={true}
      />
      <Input
        label={"Password"}
        type="password"
        name="password"
        id="password"
        pattern="*"
        defaultValue={state?.formFields?.password}
        required={true}
      />
      <button
        type="submit"
        disabled={pending}
        className={`text-xl mx-auto px-10 py-2 rounded-xl bg-green-500 hover:bg-green-600 focus:bg-green-600 hover:cursor-pointer`}
      >
        Signup
      </button>
      { state?.errors?.server && <p className="text-center text-red-500">{state.errors.server}</p> }
    </form>
  );
}
