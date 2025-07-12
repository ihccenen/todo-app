"use client";

import Input from "./input";
import Button from "./button";
import { createTodo } from "../actions/todo";
import { useActionState } from "react";

export default function TodoForm() {
  const [state, action, pending] = useActionState(createTodo, undefined);

  return (
    <form action={action} className="sm:w-xl grid gap-6 sm:mx-auto p-10 rounded-xl">
      <Input
        name="title"
        id="title"
        pattern=".*"
        defaultValue={state?.formFields?.title || ""}
        required={true}
        className="[&>input]:bg-zinc-900"
      >
        { state?.errors?.title && <span className="text-md text-red-500">{state?.errors?.title}</span> }
      </Input>
      <Button
        type="submit"
        disabled={pending}
        showSpinner={pending}
        className={`px-4 py-2 mx-auto rounded-xl ${pending ? "bg-lime-700" : "bg-lime-600 hover:bg-lime-700 focus:bg-lime-700"}`}
      >
        { pending ? "Adding Todo..." : "Add Todo" }
      </Button>
      { (state?.errors?.session || state?.errors?.server) && <span className="text-center text-md text-red-500">{state.errors.session || state.errors.server}</span> }
    </form>
  );
}
