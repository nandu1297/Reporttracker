"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authToken } from "@/lib/auth";

export async function login(_: unknown, form: FormData) {
  const pw = String(form.get("password") ?? "");
  if (!process.env.APP_PASSWORD || pw !== process.env.APP_PASSWORD) return { error: "Incorrect password" };
  (await cookies()).set("rt_auth", await authToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete("rt_auth");
  redirect("/login");
}
