import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Вход · IMOSTA Command Center" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1e1e1e] p-8 shadow-2xl">
        <p className="text-2xl font-extrabold tracking-tight text-white">
          IMOSTA<span className="text-brand">.</span>
        </p>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-white/50">Command Center</p>
        <h1 className="mt-8 text-lg font-bold text-white">Внутренний доступ</h1>
        <p className="mt-1 text-sm text-white/60">Введите ключ доступа команды.</p>
        <LoginForm />
      </div>
    </div>
  );
}
