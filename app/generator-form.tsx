"use client";

import { useState } from "react";

const TONES = [
  { id: "friendly", label: "ودودة" },
  { id: "formal", label: "رسمية" },
  { id: "marketing", label: "تسويقية" },
  { id: "luxury", label: "فاخرة" },
];

export default function GeneratorForm({ userEmail }: { userEmail: string }) {
  const [productName, setProductName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [attemptsLeftToday, setAttemptsLeftToday] = useState<number | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult("");
    setCopied(false);
    setDailyLimitReached(false);

    if (!productName.trim()) {
      setError("من فضلك اكتب اسم المنتج");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, keywords, audience, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.authRequired) {
          window.location.href = "/login";
          return;
        }
        setError(data.error || "حصل خطأ، حاول تاني");
        if (data.trialExpired) setTrialExpired(true);
        if (data.dailyLimitReached) setDailyLimitReached(true);
        return;
      }

      setResult(data.description);
      if (typeof data.trialDaysLeft === "number") {
        setTrialDaysLeft(data.trialDaysLeft);
      }
      if (typeof data.attemptsLeftToday === "number") {
        setAttemptsLeftToday(data.attemptsLeftToday);
      }
    } catch {
      setError("مفيش اتصال بالسيرفر، تأكد من الإنترنت وحاول تاني");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-4 text-xs text-stone-500">
          <span>{userEmail}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="hover:text-stone-800 transition underline"
            >
              تسجيل خروج
            </button>
          </form>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">
            مولد وصف المنتجات بالذكاء الاصطناعي
          </h1>
          <p className="mt-2 text-stone-500">
            اكتب بيانات منتجك، واحصل على وصف احترافي جاهز للنشر في ثواني
          </p>
          {trialDaysLeft !== null && !trialExpired && (
            <p className="mt-3 inline-block text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full">
              متبقي {trialDaysLeft} {trialDaysLeft === 1 ? "يوم" : "أيام"} من فترتك التجريبية المجانية
              {attemptsLeftToday !== null &&
                ` • ${attemptsLeftToday} محاولات متبقية النهاردة`}
            </p>
          )}
        </div>

        {dailyLimitReached && !trialExpired && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center mb-6">
            <h2 className="font-semibold text-blue-900 mb-1">
              وصلت للحد الأقصى لليوم
            </h2>
            <p className="text-blue-800 text-sm">
              استخدمت الأوصاف المجانية المتاحة النهاردة. جرّب تاني بكرة، أو
              اشترك عشان تستخدمها بدون حدود يومية.
            </p>
          </div>
        )}

        {trialExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-6">
            <h2 className="font-semibold text-amber-900 mb-1">
              انتهت فترتك التجريبية المجانية
            </h2>
            <p className="text-amber-800 text-sm mb-4">
              جرّبت الأداة مجانًا لمدة 7 أيام. اشترك دلوقتي عشان تكمل توليد أوصاف المنتجات بدون حدود.
            </p>
            <button
              type="button"
              className="bg-amber-900 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-amber-800 transition"
              onClick={() => alert("رابط الاشتراك هيتضاف هنا لاحقًا")}
            >
              اشترك الآن
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5 ${
            trialExpired || dailyLimitReached
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              اسم المنتج *
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="مثال: سماعة بلوتوث لاسلكية"
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              كلمات مفتاحية أو مميزات (اختياري)
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="مثال: عمر بطارية 20 ساعة، مقاومة للماء، صوت باس قوي"
              rows={3}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              الفئة المستهدفة (اختياري)
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="مثال: شباب رياضي، أمهات، محبي التكنولوجيا"
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              نبرة الكتابة
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="
