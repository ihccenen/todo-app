"use client";

import Button from "./button";
import { deleteTodo, updateTodoStatus } from "../actions/todo";
import { Todo as TodoType } from "../lib/definitions";
import { useTransition } from "react";

export default function Todo({ todo }: { todo: TodoType }) {
  const [updateIsPending, startUpdateTransition] = useTransition();
  const [deleteIsPending, startDeleteTransition] = useTransition();

  return (
    <div className={`text-2xl flex items-baseline gap-2 p-3 rounded-md ${todo.status === "pending" ? "bg-indigo-600" : "bg-indigo-800"}`}>
      <Button
        type="button"
        disabled={updateIsPending}
        onClick={() => startUpdateTransition(async () => await updateTodoStatus(todo))}
        className={`${todo.status === "completed" ? "text-lime-500 hover:text-lime-600 focus:text-lime-600" : "text-amber-500 hover:text-amber-600 focus:text-amber-600"} w-8 h-8 justify-center shrink-0 rounded-md`}
        isPending={updateIsPending}
      >
        { updateIsPending ? null : todo.status === "completed" ? "✔" : "O" }
      </Button>
      <div>
        <p className={`break-all ${todo.status === "completed" ? "decoration-2 decoration-black line-through" : ""}`}>
          {todo.title}
        </p>
      </div>
      <Button
        type="button"
        disabled={deleteIsPending}
        onClick={() => startDeleteTransition(async () => await deleteTodo(todo))}
        className={"text-zinc-900 hover:text-rose-400 focus:text-rose-400 ml-auto px-2 rounded-md"}
        isPending={deleteIsPending}
      >
        { deleteIsPending ? null : "X" }
      </Button>
    </div>
  );
}
