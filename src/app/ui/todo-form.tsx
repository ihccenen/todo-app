"use client";

import Input from "./input";
import { createTodo } from "../actions/todo";
import { useActionState } from "react";

export default function TodoForm() {
  const [state, action, pending] = useActionState(createTodo, undefined);

  return (
    <form action={action} className="sm:w-xl grid gap-6 sm:mx-auto p-10 rounded-xl bg-slate-900">
      <Input
        name="title"
        id="title"
        pattern=".*"
        defaultValue={state?.formFields?.title || ""}
        required={true}
      >
        { state?.errors?.title && <span className="text-md text-red-500">{state?.errors?.title}</span> }
      </Input>
      <button type="submit" disabled={pending} className="px-4 py-2 mx-auto rounded-xl bg-lime-700 hover:bg-lime-600 focus:bg-lime-600 hover:cursor-pointer">Add Todo</button>
      { (state?.errors?.session || state?.errors?.server) && <span className="text-center text-md text-red-500">{state.errors.session || state.errors.server}</span> }
    </form>
  );
}
