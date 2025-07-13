"use client";

import Input from "./input";
import Button from "./button";
import { signup } from "../actions/auth";
import { useActionState } from "react";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="w-[22rem] flex flex-col px-5 py-10 gap-8 border-2 border-neutral-900 rounded-xl">
      <Input
        label={"Username"}
        name="username"
        id="username"
        pattern=".{2,}"
        defaultValue={state?.formFields?.username}
        required={true}
      >
        <span className="text-sm text-red-500 hidden peer-[:invalid&:not(:placeholder-shown)]:block">
          {state?.errors?.username || "Username must be at least 2 characters long"}
        </span>
      </Input>
      <Input
        label={"Password"}
        type="password"
        name="password"
        id="password"
        pattern="(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$"
        defaultValue={state?.formFields?.password}
        required={true}
      >
        <div className={`text-sm text-red-500 ${!state?.errors?.password && "hidden peer-[:invalid&:not(:placeholder-shown)]:block"}`}>
          <p>Password requirements:</p>
          <ul className="list-disc list-inside">
            {
              state?.errors?.password
                ? state.errors.password.map((e) => <li key={e} className="text-sm text-red-500">{e}</li>)
                : <>
                    <li className="text-sm text-red-500">Must be at least 4 characters long</li>
                    <li className="text-sm text-red-500">Contain at least one letter</li>
                    <li className="text-sm text-red-500">Contain at least one number</li>
                  </>
            }
          </ul>
        </div>
      </Input>
      <Button
        type="submit"
        disabled={pending}
        className={`text-xl mx-auto px-10 py-2 rounded-xl ${pending ? "bg-lime-700" : "bg-lime-600 hover:bg-lime-700 focus:bg-lime-700"}`}
        showSpinner={pending}
      >
        { pending ? "Signing up..." : "Sign up" }
      </Button>
      { state?.errors?.server && <p className="text-center text-red-500">{state.errors.server}</p> }
    </form>
  );
}
