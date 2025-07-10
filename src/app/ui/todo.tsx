"use client";

import { deleteTodo, updateTodoStatus } from "../actions/todo";
import { Todo as TodoType } from "../lib/definitions";

export default function Todo({ todo }: {todo: TodoType }) {
  return (
    <div className="text-2xl max-sm:text-xl flex items-center gap-2 p-3 rounded-md bg-cyan-600">
      <button
        type="button"
        onClick={() => updateTodoStatus(todo)}
        className={`${todo.status === "completed" ? "text-lime-500 hover:text-lime-600 focus:text-lime-600" : "text-amber-500 hover:text-amber-600 focus:text-amber-600"} w-8 h-8 shrink-0 rounded-md hover:cursor-pointer`}
      >
        {todo.status === "completed" ? "✔" : "O"}
      </button>
      <div>
        <p
          className={`break-all inline bg-gradient-to-l from-black to-black bg-no-repeat bg-[length:0px_0.1em] transition-all duration-1000 ease-in ${todo.status === "completed" && "bg-[length:100%_0.1em]"} bg-[0px_center]`}
        >
          {todo.title}
        </p>
      </div>
      <button
        type="submit"
        onClick={() => deleteTodo(todo)}
        className="text-[1.3rem] font-bold text-zinc-700 hover:text-zinc-800 focus:text-zinc-800 ml-auto px-2 rounded-md hover:cursor-pointer"
      >
        X
      </button>
    </div>
  );
}
