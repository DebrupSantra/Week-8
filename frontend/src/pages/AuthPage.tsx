import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckSquare2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/errors";

type Props = {
  mode: "login" | "register";
};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-950";

export function AuthPage({ mode }: Props) {
  const isRegister = mode === "register";
  const [serverError, setServerError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const registerUser = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const schema = z
    .object({
      fullName: z.string().max(120, "Use 120 characters or fewer."),
      email: z.string().trim().email("Enter a valid email address.").max(254),
      password: z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer."),
    })
    .superRefine((values, context) => {
      if (isRegister && !values.fullName.trim()) {
        context.addIssue({
          code: "custom",
          path: ["fullName"],
          message: "Enter your full name.",
        });
      }
    });

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function submit(values: z.infer<typeof schema>) {
    setServerError(null);
    try {
      if (isRegister) {
        await registerUser(values.fullName.trim(), values.email, values.password);
      } else {
        await login(values.email, values.password);
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, "Unable to authenticate. Please try again."));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_1.05fr]">
        <section className="hidden flex-col justify-between bg-indigo-700 p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2.5">
              <CheckSquare2 size={22} />
            </div>
            <span className="text-lg font-semibold">Taskflow</span>
          </div>
          <div className="max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">
              Focus on what matters
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Make your next great thing happen.
            </h1>
            <p className="mt-4 leading-7 text-indigo-100">
              A calm, clear place to organize work, track progress, and keep momentum.
            </p>
          </div>
          <p className="text-sm text-indigo-200">Your work, thoughtfully organized.</p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-indigo-600 p-2 text-white">
              <CheckSquare2 size={20} />
            </div>
            <span className="font-semibold">Taskflow</span>
          </div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {isRegister ? "GET STARTED" : "WELCOME BACK"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRegister
              ? "Set up your workspace and start making progress."
              : "Pick up right where you left off."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
            {isRegister && (
              <label className="block text-sm font-medium">
                Full name
                <input
                  {...registerField("fullName")}
                  autoComplete="name"
                  className={fieldClass}
                  placeholder="Alex Morgan"
                />
                {errors.fullName && (
                  <span className="mt-1.5 block text-xs text-rose-600">{errors.fullName.message}</span>
                )}
              </label>
            )}
            <label className="block text-sm font-medium">
              Email address
              <input
                {...registerField("email")}
                type="email"
                autoComplete="email"
                className={fieldClass}
                placeholder="you@example.com"
              />
              {errors.email && (
                <span className="mt-1.5 block text-xs text-rose-600">{errors.email.message}</span>
              )}
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                {...registerField("password")}
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className={fieldClass}
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <span className="mt-1.5 block text-xs text-rose-600">{errors.password.message}</span>
              )}
            </label>
            {serverError && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
                {serverError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? "Already have an account?" : "New to Taskflow?"}{" "}
            <Link
              to={isRegister ? "/login" : "/register"}
              className="font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-400"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
