import { z } from 'zod'

const UserSchema = z.object({
  id: z.number(),
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters long" })
    .trim(),
  password: z
    .string()
    .min(4, { message: "Must be at least 4 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter" })
    .regex(/[0-9]/, { message: "Contain at least one number" })
    .trim(),
})

export const User = UserSchema.omit({ id: true });

export type UserFormState = {
  errors?: {
    username?: string[];
    password?: string[];
    server?: string;
  };
  formFields?: {
    username?: string;
    password?: string;
  };
} | undefined;

export type SessionPayload = {
  username: string;
  userId: number;
  expiresAt: Date;
};

export type UserSession = {
  isAuth: boolean;
  username: string;
  userId: number;
};

const TodoSchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(1, { message: "Empty title" })
    .trim(),
  status: z.enum(["completed", "pending"]),
  createdAt: z.date(),
});

export const Todo = TodoSchema.omit({ id: true, status: true, createdAt: true });

export type Todo = z.infer<typeof TodoSchema>;

export type TodoFormState = {
  errors?: {
    session?: string,
    title?: string[];
    server?: string,
  };
  formFields?: {
    title?: string;
  };
} | undefined;
