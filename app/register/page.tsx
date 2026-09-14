"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerUser } from "@/app/register/actions";
import { registrationSchema, type RegistrationInput } from "@/lib/validation/auth";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema) });
  async function submit(input: RegistrationInput) { setServerError(""); const result = await registerUser(input); if (!result.ok) { setServerError(result.error); return; } router.push(searchParams.get("next") || "/"); }
  return <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-6 text-stone-900"><form onSubmit={handleSubmit(submit)} className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"><Link href="/" className="text-sm text-stone-500">← Digital Cafe</Link><h1 className="mt-10 font-serif text-4xl">Make it yours.</h1><p className="mt-2 text-sm text-stone-600">Create an account to keep your orders together.</p>{([['name','Name','text'],['email','Email','email'],['password','Password','password'],['confirmPassword','Confirm password','password']] as const).map(([field,label,type]) => <label key={field} className="mt-4 block text-sm font-medium">{label}<input {...register(field)} type={type} autoComplete={type === 'password' ? 'new-password' : field} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-amber-700" />{errors[field] && <span className="mt-1 block text-xs text-red-700">{errors[field]?.message}</span>}</label>)}{serverError && <p role="alert" className="mt-4 text-sm text-red-700">{serverError}</p>}<button disabled={isSubmitting} className="mt-6 w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Creating account..." : "Create account"}</button><p className="mt-5 text-center text-sm text-stone-500">Already have an account? <Link href="/login" className="font-semibold text-stone-900 underline">Sign in</Link></p></form></main>;
}
