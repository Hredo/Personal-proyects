'use server'

import { signIn } from "@/auth";
import db from "@/lib/db";
import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";


const RegisterSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function register(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      return { error: { email: ["El email ya está registrado"] } };
    }

    const hashedPassword = await hash(password, 10);
    const userId = "u_" + Math.random().toString(36).substring(2, 9);
    const clientId = "c_" + Math.random().toString(36).substring(2, 9);

    const info = db.transaction(() => {
      db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
        userId, name, email, hashedPassword, "CLIENT"
      );
      db.prepare('INSERT INTO clients (id, userId) VALUES (?, ?)').run(
        clientId, userId
      );
    })();

    return { success: "Usuario creado exitosamente" };
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Ocurrió un error al registrar el usuario" };
  }
}

export async function login(formData: FormData) {
  const validatedFields = LoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    if (error instanceof AuthError || error.message?.includes("CredentialsSignin")) {
      return { error: "Credenciales inválidas" };
    }
    throw error;
  }
}
