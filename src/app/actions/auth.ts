"use server";

import { createSession, deleteSession } from "../lib/session";
import { User, UserFormState } from '@/app/lib/definitions'
import prisma from "../lib/prisma";
import { Prisma } from '@prisma/client';
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function signup(_: UserFormState, formData: FormData): Promise<UserFormState> {
  const validatedFields = User.safeParse({
    username: formData.get("username")?.toString(),
    password: formData.get("password")?.toString(),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      formFields: {
        username: formData.get("username")?.toString(),
        password: formData.get("password")?.toString(),
      },
    };
  }

  const { username, password } = validatedFields.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    console.log(`User ${result.username} created`);
    await createSession(result.username, result.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          errors: {
            username: [`Username "${formData.get("username")?.toString()}" already exists`],
          },
          formFields: {
            username,
            password,
          },
        };
      }
    } else if (e instanceof Prisma.PrismaClientInitializationError) {
      console.log("Failed to connect to the database");
      return {
        errors: {
          server: "Failed to connect to the database",
        },
        formFields: {
          username,
          password,
        },
      };
    }

    return {
      errors: {
        server: "Unknow error",
      },
      formFields: {
        username,
        password,
      },
    };
  }

  redirect("/");
}

export async function login(_:UserFormState, formData: FormData): Promise<UserFormState> {
  const validatedFields = User.safeParse({
    username: formData.get("username")?.toString(),
    password: formData.get("password")?.toString(),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      formFields: {
        username: formData.get("username")?.toString(),
        password: formData.get("password")?.toString(),
      },
    };
  }

  const { username, password } = validatedFields.data;

  try {
    const result = await prisma.user.findFirst({
      where: {
        username,
      }
    });

    if (!result || !await bcrypt.compare(password, result.password)) {
      return {
        errors: {
          server: "Username or password wrong",
        },
        formFields: {
          username,
          password,
        }
      };
    }

    console.log(`User ${result.username} logged in`);
    await createSession(result.username, result.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          errors: {
            username: [`Username "${formData.get("username")?.toString()}" already exists`],
          },
          formFields: {
            username,
            password,
          },
        };
      }
    } else if (e instanceof Prisma.PrismaClientInitializationError) {
      console.log("Failed to connect to the database");

      return {
        errors: {
          server: "Failed to connect to the database",
        },
        formFields: {
          username,
          password,
        },
      };
    }
  }

  redirect("/");
}

export async function logout(_: FormData): Promise<void> {
  await deleteSession();
}
