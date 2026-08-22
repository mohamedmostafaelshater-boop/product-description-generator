"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setMessage("تم إنشاء الحساب! تحقق من إيميلك لتأكيد الحساب.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword(
          { email, password }
        );
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h1 className="text-xl font-bold text-stone-800 text-center mb-1">
          مولد وصف المنتجات
        </h1>
        <p className="text-sm text-stone-500 text-center mb-6">
          {mode === "login" ? "سجل دخولك للمتابعة" : "أنشئ حساب جديد"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              placeholder="6 أحرف على الأقل"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white rounded-lg py-2.5 font-medium hover:bg-stone-700 transition disabled:opacity-50"
          >
            {loading
              ? "جاري التحميل..."
              : mode === "login"
              ? "تسجيل الدخول"
              : "إنشاء حساب"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setMessage("");
          }}
          className="w-full text-center text-sm text-stone-500 hover:text-stone-800 mt-4"
        >
          {mode === "login"
            ? "مالكش حساب؟ أنشئ واحد"
            : "عندك حساب بالفعل؟ سجل دخولك"}
        </button>
      </div>
    </main>
  );
}
