const SYSTEM_PROMPT = `You are a helpful customer service assistant for M-Group (บริษัท มหาโชค มหาชัย อินเตอร์เทรด จำกัด), a leading Thai supplier of agricultural equipment, rubber plantation tools, fishing rope, construction hardware, and safety gear with over 40 years of experience.

CRITICAL RULE: Always detect the language of the user's message and respond ONLY in that exact language.
- If the user writes in Thai → respond in Thai
- If the user writes in English → respond in English
- If the user writes in Chinese → respond in Chinese
- If the user writes in any other language → respond in that language

Keep responses concise and helpful. You can help with: product inquiries, pricing, orders, delivery, and general M-Group information.
Contact: โทร 089-487-1144 | แฟกซ์ 034-878369, 034-848022 | อีเมล sale@m-group.in.th | เว็บไซต์ m-group.in.th`

export async function POST(req){
  try{
    const { message, history = [], lang = 'th' } = await req.json()
    if (!message) return new Response(JSON.stringify({ error: 'message required' }), { status: 400 })

    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim()
    const openaiKey = process.env.OPENAI_API_KEY?.trim()

    if (!anthropicKey && !openaiKey) {
      const mocks = {
        th: `สวัสดีครับ! ผมคือ AI ผู้ช่วยของ M-Group 🌾\nมีอะไรให้ช่วยได้บ้างครับ? สอบถามสินค้า ราคา หรือการสั่งซื้อได้เลยครับ`,
        en: `Hello! I'm M-Group's AI assistant 🌾\nHow can I help you? Feel free to ask about products, pricing, or orders.`,
        zh: `您好！我是M-Group的AI助手 🌾\n有什么可以帮助您的吗？欢迎咨询产品、价格或订单。`,
      }
      return new Response(JSON.stringify({ text: mocks[lang] || mocks.th }), { status: 200 })
    }

    let text = ''

    if (anthropicKey) {
      // Build messages array for Anthropic (no system role in messages)
      const msgs = [
        ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ]
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: msgs,
        })
      })
      if (!resp.ok) {
        const err = await resp.text()
        return new Response(JSON.stringify({ error: 'Anthropic error', details: err }), { status: 502 })
      }
      const data = await resp.json()
      text = data.content?.[0]?.text || ''
    } else {
      const msgs = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-10),
        { role: 'user', content: message }
      ]
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini', messages: msgs, max_tokens: 500 })
      })
      if (!resp.ok) {
        const err = await resp.text()
        return new Response(JSON.stringify({ error: 'OpenAI error', details: err }), { status: 502 })
      }
      const data = await resp.json()
      text = data.choices?.[0]?.message?.content || ''
    }

    return new Response(JSON.stringify({ text }), { status: 200 })
  }catch(err){
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
