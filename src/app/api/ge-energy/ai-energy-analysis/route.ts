import { resolveAiCredentials } from '@/lib/energy/ai-settings';

interface MonthlyData {
  monthIndex: number;
  year: number | string;
  before: number;
  after: number;
  costBefore: number;
  costAfter: number;
  savedKwh?: number;
}

interface AiInsights {
  trend: string;
  problems: string[];
  heavyLoad: { months: string[]; reason: string };
  lightLoad: { months: string[]; reason: string };
  recommendations: string[];
  forecast: string;
}

function getLanguage(locale: string): 'Thai' | 'Korean' | 'English' {
  if (locale === 'th') return 'Thai';
  if (locale === 'ko') return 'Korean';
  return 'English';
}

function computeRuleBasedAnalysis(data: MonthlyData[], locale: string): AiInsights {
  const monthNames = {
    th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
    ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  const labels = {
    th: {
      trend: 'แนวโน้มการใช้ไฟ',
      improving: 'ทำงานได้ดีขึ้นเรื่อยๆ ค่าไฟหลังติดตั้งมีแนวโน้มลดลง',
      worsening: 'มีแนวโน้มเพิ่มขึ้น ต้องตรวจสอบอุปกรณ์',
      heavy: 'เดือนที่มีการใช้งานหนักและประหยัดมากที่สุด',
      light: 'เดือนที่มีการใช้งานน้อยที่สุด',
      recommendations: 'ตรวจสอบอุปกรณ์ที่ใช้พลังงานสูง, ปิดอุปกรณ์เมื่อไม่ใช้, ทำความเย็นแบบประหยัดพลังงาน',
      forecast: 'ลดลงต่อไป เหตุจากการตรวจสอบและบำรุงรักษา',
      problem1: 'มีเดือนที่ประหยัดต่ำ ต้องตรวจสอบการสึกหรอของอุปกรณ์',
    },
    ko: {
      trend: '전력 사용 추세',
      improving: '점점 더 잘 작동하고 있습니다. 설치 후 전기료가 감소하는 추세입니다.',
      worsening: '증가 추세입니다. 장비를 점검하십시오.',
      heavy: '사용량이 많고 절약이 가장 많은 달입니다.',
      light: '사용량이 가장 적은 달입니다.',
      recommendations: '에너지를 많이 사용하는 장비를 확인하세요, 사용하지 않을 때는 장비를 끄세요, 에너지 절약형 냉각을 사용하세요',
      forecast: '계속 감소할 것 같습니다. 점검 및 유지보수 때문입니다.',
      problem1: '절약이 낮은 달이 있습니다. 장비 마모를 점검하십시오.',
    },
    en: {
      trend: 'Electricity Usage Trend',
      improving: 'Performance improving over time. Post-installation costs show declining trend.',
      worsening: 'Increasing trend detected. Equipment maintenance needed.',
      heavy: 'Months with highest usage and maximum savings.',
      light: 'Months with lowest usage.',
      recommendations: 'Check high-energy equipment, Turn off unused devices, Use energy-efficient cooling',
      forecast: 'Continued decline expected due to maintenance and optimization.',
      problem1: 'Low savings in some months. Equipment wear should be inspected.',
    },
  };

  const lang = locale as 'th' | 'ko' | 'en';
  const l = labels[lang] || labels.en;
  const names = monthNames[lang] || monthNames.en;

  // Calculate trend
  const afterValues = data.map(d => d.after);
  const avgFirst3 = afterValues.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const avgLast3 = afterValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const trendDirection = avgLast3 < avgFirst3;
  const trend = trendDirection ? l.improving : l.worsening;

  // Find heavy and light load months
  const withSavingsPct = data.map(d => ({
    ...d,
    savingsPct: d.before > 0 ? ((d.before - d.after) / d.before) * 100 : 0,
    monthName: `${names[Math.max(0, Math.min(11, d.monthIndex - 1))]} ${d.year}`,
  }));

  const heavyLoadMonths = withSavingsPct
    .filter(d => d.savingsPct >= 26)
    .map(d => d.monthName);
  const lightLoadMonths = withSavingsPct
    .filter(d => d.savingsPct <= 25)
    .map(d => d.monthName);

  return {
    trend,
    problems: [l.problem1],
    heavyLoad: { months: heavyLoadMonths, reason: l.heavy },
    lightLoad: { months: lightLoadMonths, reason: l.light },
    recommendations: l.recommendations.split(', '),
    forecast: l.forecast,
  };
}

export async function POST(req: Request) {
  try {
    const { monthly, locale = 'th', site = 'thailand' } = await req.json();

    if (!Array.isArray(monthly) || monthly.length === 0) {
      return Response.json(
        { success: false, error: 'Invalid monthly data' },
        { status: 400 }
      );
    }

    const creds = await resolveAiCredentials();
    const lang = getLanguage(locale);

    // Prepare payload for AI
    const analysisPayload = {
      periodMonths: monthly.length,
      months: monthly.map((m: MonthlyData) => ({
        month: m.monthIndex,
        year: m.year,
        before: m.before,
        after: m.after,
        costBefore: m.costBefore,
        costAfter: m.costAfter,
        savingsPct:
          m.before > 0
            ? (((m.before - m.after) / m.before) * 100).toFixed(1)
            : '0',
      })),
      summary: {
        totalBefore: monthly.reduce((s: number, m: MonthlyData) => s + m.before, 0),
        totalAfter: monthly.reduce((s: number, m: MonthlyData) => s + m.after, 0),
        totalCostBefore: monthly.reduce((s: number, m: MonthlyData) => s + m.costBefore, 0),
        totalCostAfter: monthly.reduce((s: number, m: MonthlyData) => s + m.costAfter, 0),
      },
      note: 'Before = energy usage before installation, After = energy usage after installation',
    };

    const systemPrompt = `You are an energy analyst for GE Energy Tech. Analyze this electricity consumption data (before/after energy-saving installation comparison).
Be concise in ${lang}. Structure your response as ONLY valid JSON (no markdown, no extra text) with these exact fields:
{
  "trend": "2-3 sentence summary of usage trend (improving vs worsening)",
  "problems": ["issue1", "issue2", "issue3"],
  "heavyLoad": { "months": ["Month1", "Month2"], "reason": "why these months have high load" },
  "lightLoad": { "months": ["Month1", "Month2"], "reason": "why these months have low load" },
  "recommendations": ["action1", "action2", "action3", "action4"],
  "forecast": "prediction for next 2 months (1-2 sentences)"
}`;

    // If no AI key available, use rule-based fallback
    if (creds.source === 'none') {
      const ruleBased = computeRuleBasedAnalysis(monthly, locale);
      return Response.json({
        success: true,
        data: {
          insights: ruleBased,
          aiAvailable: false,
          ruleBasedFallback: true,
        },
      });
    }

    // Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        model: creds.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(analysisPayload) },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const ruleBased = computeRuleBasedAnalysis(monthly, locale);
      return Response.json({
        success: true,
        data: {
          insights: ruleBased,
          aiAvailable: false,
          ruleBasedFallback: true,
          fallbackReason: 'OpenAI API error',
        },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let insights: AiInsights;
    try {
      insights = JSON.parse(content);
    } catch {
      // Fallback if parsing fails
      insights = computeRuleBasedAnalysis(monthly, locale);
    }

    return Response.json({
      success: true,
      data: {
        insights,
        aiAvailable: true,
        ruleBasedFallback: false,
        site,
      },
    });
  } catch (error) {
    console.error('AI energy analysis error:', error);

    // Graceful fallback on any error
    return Response.json({
      success: true,
      data: {
        insights: computeRuleBasedAnalysis([], 'th'),
        aiAvailable: false,
        ruleBasedFallback: true,
        error: error instanceof Error ? error.message : 'Analysis error',
      },
    });
  }
}
