import { getTodos } from "../lib/todo";
import Todo from "./todo";

export default async function Todos() {
  const result = await getTodos();

  return (
    <div className="grid gap-5 p-2 md:p-5 border-1 border-neutral-800">
      { Array.isArray(result)
        ? result.length ? result.map((todo) => <Todo key={todo.id} todo={todo}/>) : <p className="text-2xl text-center">No todos</p>
        : <p className="text-2xl text-center">{result}</p>
      }
    </div>
  );
}
