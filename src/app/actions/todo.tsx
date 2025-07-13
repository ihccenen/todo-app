"use server";

import { Todo, TodoFormState }  from "../lib/definitions";
import { verifySession } from "../lib/session";
import prisma from "../lib/prisma";
import { Prisma } from '@prisma/client';
import { revalidatePath } from "next/cache";

export async function createTodo(_: TodoFormState, formData: FormData): Promise<TodoFormState> {
  const validatedFields = Todo.safeParse({
    title: formData.get("title")?.toString(),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      formFields: {
        title: formData.get("title")?.toString() || "",
      }
    }
  }

  const { title } = validatedFields.data;

  const session = await verifySession();

  if (!session) {
    return {
      errors: {
        session: "Failed to verify session",
      },
      formFields: {
        title,
      },
    }
  };

  try {
    const result = await prisma.todo.create({
      data: {
        title,
        userId: session.userId,
      }
    });

    if (!result) {
      return {
        errors: {
          server: "Failed to add todo to the database",
        },
        formFields: {
          title,
        },
      }
    }

    revalidatePath("/");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError || e instanceof Prisma.PrismaClientUnknownRequestError) {
      console.log(e.message);

      return {
        errors: {
          server: "Failed to add todo",
        },
        formFields: {
          title,
        },
      };
    } else if (e instanceof Prisma.PrismaClientInitializationError) {
      console.log("Failed to connect to the database");

      return {
        errors: {
          server: "Failed to connect to the database",
        },
        formFields: {
          title,
        },
      };
    }

    return {
      errors: {
        server: "Unknow server error",
      },
      formFields: {
        title,
      },
    };
  }
}

export async function deleteTodo({ id }: Todo): Promise<void> {
   const session = await verifySession();

  if (!session) {
    return;
  }

  try {
    const result = await prisma.todo.delete({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!result) {
      return;
    }

    revalidatePath("/");
  } catch (e) {
    console.log(e);
  }
}

export async function updateTodoStatus({ id }: Todo): Promise<void> {
  const session = await verifySession();

  if (!session) {
    return;
  }

  try {
    const todo = await prisma.todo.findUnique({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!todo) {
      return;
    }

    const result = await prisma.todo.update({
      where: {
        id,
        userId: session.userId,
      },
      data: {
        status: todo.status === "pending" ? "completed" : "pending",
        completedAt: todo.status === "pending" ? new Date() : null,
      },
    });

    if (!result) {
      return;
    }

    revalidatePath("/");
  } catch (e) {
    console.log(e);
  }
}
