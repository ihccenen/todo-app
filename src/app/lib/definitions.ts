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
