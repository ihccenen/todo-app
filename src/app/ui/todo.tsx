"use client";

import Button from "./button";
import { deleteTodo, updateTodoStatus } from "../actions/todo";
import { Todo as TodoType } from "../lib/definitions";
import { useState, useTransition } from "react";

export default function Todo({ todo }: { todo: TodoType }) {
  const [updateIsPending, startUpdateTransition] = useTransition();
  const [deleteIsPending, startDeleteTransition] = useTransition();
  const [timeoutID, setTimeoutID] = useState(null as number | null);
  const [shouldSlide, setShouldSlide] = useState(false);
  const [translateX, setTranslateX] = useState(null as number | null);
  const [lastClientX, setLastClientX] = useState(null as number | null);
  const [slideShouldDelete, setSlideShouldDelete] = useState(false);

  const handleUpdatePointerDown = (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || updateIsPending)
      return;

    e.stopPropagation();
    startUpdateTransition(async () => await updateTodoStatus(todo));
  };

  const handleDeletePointerDown = (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || deleteIsPending)
      return;

    e.stopPropagation();
    startDeleteTransition(async () => await deleteTodo(todo));
  };

  const handleTodoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0)
      return;

    setShouldSlide(true);

    setTimeoutID(window.setTimeout(() => {
      window.getSelection()?.removeAllRanges();
      setTranslateX(0);
      setLastClientX(e.clientX);
    }, 200));

    e.currentTarget.setPointerCapture(e.pointerId);
  }

  const handleTodoPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setShouldSlide(false);

    if (timeoutID) {
      window.clearTimeout(timeoutID);
      setTimeoutID(null);
      setTranslateX(null);
      setLastClientX(null);
    }

    if (slideShouldDelete) {
      startDeleteTransition(async () => await deleteTodo(todo));
    }

    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const handleTodoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (timeoutID && translateX === null) {
      window.clearTimeout(timeoutID);
      setTimeoutID(null);
      setShouldSlide(false);
      setLastClientX(null);
    } else {
      setTranslateX((prev) => (!lastClientX || prev === null) ? prev : prev - (lastClientX - e.clientX));
      setLastClientX(e.clientX);
      const offset = e.currentTarget.offsetWidth / 3;
      setSlideShouldDelete(
        e.currentTarget.getBoundingClientRect().right - offset > (e.currentTarget.parentElement?.getBoundingClientRect().right || Infinity) ||
          e.currentTarget.getBoundingClientRect().left + offset < (e.currentTarget.parentElement?.getBoundingClientRect().left || Infinity)
      );
    }
  }

  return (
    <div
      style={{ transform: `translate(${translateX || 0}px)` }}
      className={`flex items-baseline gap-2 p-3 rounded-md transition:[transform,colors] duration-500 ${shouldSlide && translateX !== null ? "transition-colors select-none cursor-grab bg-indigo-900" : todo.status === "completed" ? "bg-indigo-800" : "bg-indigo-600"} border-1 ${slideShouldDelete ? "border-red-500" : "border-transparent" } ${deleteIsPending && "opacity-50"}`}
      onPointerDown={handleTodoPointerDown}
      onPointerUp={handleTodoPointerUp}
      onPointerMove={shouldSlide ? handleTodoPointerMove : undefined}
      onContextMenu={() => setShouldSlide(false)}
    >
      <Button
        type="button"
        disabled={updateIsPending}
        onClick={handleUpdatePointerDown}
        onPointerDown={handleUpdatePointerDown}
        className={`${todo.status === "completed" ? "text-lime-500 hover:text-lime-600 focus:text-lime-600" : "text-amber-500 hover:text-amber-600 focus:text-amber-600"} w-8 h-8 justify-center shrink-0 rounded-md`}
        isPending={updateIsPending}
      >
        { updateIsPending ? null : todo.status === "completed" ? "✔" : "O" }
      </Button>
      <p className={`break-all ${todo.status === "completed" ? "decoration-2 decoration-black line-through" : ""}`}>
        {todo.title}
      </p>
      <Button
        type="button"
        disabled={deleteIsPending}
        onClick={handleDeletePointerDown}
        onPointerDown={handleDeletePointerDown}
        className={"text-zinc-900 hover:text-rose-400 focus:text-rose-400 ml-auto px-2 rounded-md"}
        isPending={deleteIsPending}
      >
        { deleteIsPending ? null : "X" }
      </Button>
    </div>
  );
}
