"use server";

import { Todo } from "./definitions";
import { verifySession } from "./session";
import prisma from "./prisma";

export async function getTodos(): Promise<Todo[] | string> {
  const session = await verifySession();

  if (!session) {
    return "Failed to verify session";
  }

  try {
    const result = await prisma.todo.findMany({
      where: {
        userId: session.userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: [
        { completedAt: { sort: "desc", nulls: "first" } },
        { createdAt: "desc" },
      ],
    });

    return result as Todo[];
  } catch (e) {
    return "Failed to fetch todos";
  }
}
