import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TRIAL_DAYS = 7;
const DAILY_LIMIT = 5;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "لازم تسجل دخول الأول", authRequired: true },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    const { data: usageRow, error: fetchError } = await supabase
      .from("usage")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Usage fetch error:", fetchError);
      return NextResponse.json(
        { error: "حصل خطأ في السيرفر. حاول تاني." },
        { status: 500 }
      );
    }

    let trialStart: Date;
    let usageDate: string;
    let usageCount: number;

    if (!usageRow) {
      trialStart = now;
      usageDate = todayKey;
      usageCount = 0;

      const { error: insertError } = await supabase.from("usage").insert({
        user_id: user.id,
        trial_start: now.toISOString(),
        usage_date: todayKey,
        usage_count: 0,
      });

      if (insertError) {
        console.error("Usage insert error:", insertError);
        return NextResponse.json(
          { error: "حصل خطأ في السيرفر. حاول تاني." },
          { status: 500 }
        );
      }
    } else {
      trialStart = new Date(usageRow.trial_start);
      usageDate = usageRow.usage_date;
      usageCount = usageDate === todayKey ? usageRow.usage_count : 0;
    }

    const daysSinceStart =
      (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceStart >= TRIAL_DAYS) {
      return NextResponse.json(
        {
          error:
            "انتهت فترتك التجريبية المجانية (7 أيام). اشترك عشان تكمل استخدام الأداة.",
          trialExpired: true,
        },
        { status: 403 }
      );
    }

    if (usageCount >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `وصلت للحد الأقصى (${DAILY_LIMIT} أوصاف) لليوم. جرّب تاني بكرة.`,
          dailyLimitReached: true,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { productName, keywords, tone, audience } = body as {
      productName?: string;
      keywords?: string;
      tone?: string;
      audience?: string;
    };

    if (!productName || productName.trim().length === 0) {
      return NextResponse.json(
        { error: "اسم المنتج مطلوب" },
        { status: 400 }
      );
    }

    const toneMap: Record<string, string> = {
      formal: "رسمية واحترافية",
      friendly: "ودودة وقريبة من العميل",
      marketing: "تسويقية حماسية تحفّز على الشراء",
      luxury: "فاخرة وراقية",
    };

    const toneDescription = toneMap[tone || "friendly"] || toneMap.friendly;

    const prompt = `اكتب وصف منتج احترافي باللغة العربية الفصحى المبسطة لمتجر إلكتروني.

اسم المنتج: ${productName}
${keywords ? `كلمات مفتاحية / مميزات: ${keywords}` : ""}
${audience ? `الفئة المستهدفة: ${audience}` : ""}
نبرة الكتابة المطلوبة: ${toneDescription}

المطلوب:
- وصف مكوّن من فقرتين إلى ثلاث فقرات قصيرة.
- عنوان جذاب قصير في الأول (سطر واحد).
- 3 نقاط (bullet points) لأهم المميزات في النهاية.
- لا تستخدم كلمات مبالغ فيها بلا معنى (زي "الأفضل على الإطلاق") إلا لو ناسب النبرة المطلوبة فعلاً.
- اكتب المحتوى جاهز للنشر مباشرة على صفحة المنتج بدون أي تعليقات أو شرح منك.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const generatedText =
      textBlock && textBlock.type === "text" ? textBlock.text : "";

    const newUsageCount = usageCount + 1;
    const { error: updateError } = await supabase
      .from("usage")
      .update({ usage_date: todayKey, usage_count: newUsageCount })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Usage update error:", updateError);
    }

    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysSinceStart));
    const attemptsLeftToday = Math.max(0, DAILY_LIMIT - newUsageCount);

    return NextResponse.json({
      description: generatedText,
      trialDaysLeft: daysLeft,
      attemptsLeftToday,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "حصل خطأ أثناء توليد الوصف. حاول تاني." },
      { status: 500 }
    );
  }
}
