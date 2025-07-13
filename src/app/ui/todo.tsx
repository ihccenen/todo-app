"use client";

import Button from "./button";
import { deleteTodo, updateTodoStatus } from "../actions/todo";
import { Todo as TodoType } from "../lib/definitions";
import { useState } from "react";

export default function Todo({ todo }: {todo: TodoType }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className={`text-2xl max-sm:text-xl flex items-center gap-2 p-3 rounded-md ${todo.status === "pending" ? "bg-indigo-900" : "transtion-colors duration-3000 bg-indigo-950"}`}>
      <Button
        type="button"
        disabled={updatingStatus}
        onClick={() => {
          setUpdatingStatus(true);
          updateTodoStatus(todo)
            .then(() => setUpdatingStatus(false))
            .catch(() => setUpdatingStatus(false));
        }}
        className={`${todo.status === "completed" ? "text-lime-500 hover:text-lime-600 focus:text-lime-600" : "text-amber-500 hover:text-amber-600 focus:text-amber-600"} w-8 h-8 justify-center shrink-0 rounded-md`}
        showSpinner={updatingStatus}
      >
        { updatingStatus ? null : todo.status === "completed" ? "✔" : "O" }
      </Button>
      <div className="relative z-1">
        <p className={`break-all inline bg-[length:0px_0.1em] bg-[0px_center] ${todo.status === "completed" && "bg-gradient-to-l from-black to-black bg-no-repeat transition-all duration-1000 ease-in bg-[length:100%_0.1em]"}`}>
          <span className="relative -z-1">{todo.title}</span>
        </p>
      </div>
      <Button
        type="button"
        disabled={deleting}
        onClick={() => {
          setDeleting(true);
          deleteTodo(todo)
            .then(() => setDeleting(false))
            .catch(() => setDeleting(false));
        }}
        className={`text-[1.3rem] font-bold text-zinc-400 hover:text-zinc-500 focus:text-zinc-500 ml-auto px-2 rounded-md`}
        showSpinner={deleting}
      >
        { deleting ? null : "X" }
      </Button>
    </div>
  );
}
