import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatCLP(n: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return { from, to }
}

// Herramientas que Claude puede llamar
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === 'get_today_expenses') {
      const today = todayStr()
      const { data } = await supabase
        .from('expenses')
        .select('amount, detail, vendor, categories(name), responsibles(name), payment_methods(name)')
        .eq('expense_date', today)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) return 'No hay gastos registrados hoy.'
      const total = data.reduce((s, e) => s + e.amount, 0)
      const lines = data.map((e) => {
        const cat = (e as unknown as { categories?: { name: string } }).categories?.name ?? 'Sin categoría'
        const label = e.vendor ?? e.detail ?? cat
        return `- ${label}: ${formatCLP(e.amount)}`
      })
      return `Gastos de hoy (${today}):\n${lines.join('\n')}\nTotal: ${formatCLP(total)}`
    }

    if (name === 'get_expenses_by_period') {
      const { from, to } = input as { from: string; to: string }
      const { data } = await supabase
        .from('expenses')
        .select('amount, detail, vendor, expense_date')
        .gte('expense_date', from)
        .lte('expense_date', to)

      if (!data || data.length === 0) return `No hay gastos entre ${from} y ${to}.`
      const total = data.reduce((s, e) => s + e.amount, 0)
      return `Del ${from} al ${to}: ${data.length} gastos, total ${formatCLP(total)}`
    }

    if (name === 'get_expenses_by_category') {
      const { from, to, category_name } = input as { from: string; to: string; category_name?: string }
      let query = supabase
        .from('expenses')
        .select('amount, categories!inner(name)')
        .gte('expense_date', from)
        .lte('expense_date', to)

      if (category_name) {
        query = query.ilike('categories.name' as never, `%${category_name}%`)
      }

      const { data } = await query

      if (!data || data.length === 0) return 'Sin gastos en el período.'

      const byCategory: Record<string, number> = {}
      for (const e of data) {
        const cat = (e as unknown as { categories?: { name: string } }).categories?.name ?? 'Sin categoría'
        byCategory[cat] = (byCategory[cat] ?? 0) + e.amount
      }

      const lines = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, total]) => `- ${cat}: ${formatCLP(total)}`)

      return `Gastos por categoría (${from} al ${to}):\n${lines.join('\n')}`
    }

    if (name === 'get_expenses_by_responsible') {
      const { from, to, responsible_name } = input as { from: string; to: string; responsible_name?: string }
      let query = supabase
        .from('expenses')
        .select('amount, responsibles!inner(name)')
        .gte('expense_date', from)
        .lte('expense_date', to)

      if (responsible_name) {
        query = query.ilike('responsibles.name' as never, `%${responsible_name}%`)
      }

      const { data } = await query

      if (!data || data.length === 0) return 'Sin gastos en el período.'

      const byResp: Record<string, number> = {}
      for (const e of data) {
        const resp = (e as unknown as { responsibles?: { name: string } }).responsibles?.name ?? 'Sin responsable'
        byResp[resp] = (byResp[resp] ?? 0) + e.amount
      }

      const lines = Object.entries(byResp)
        .sort((a, b) => b[1] - a[1])
        .map(([r, t]) => `- ${r}: ${formatCLP(t)}`)

      return `Gastos por responsable (${from} al ${to}):\n${lines.join('\n')}`
    }

    if (name === 'get_monthly_summary') {
      const { year, month } = input as { year: number; month: number }
      const { from, to } = monthRange(year, month)
      const { data } = await supabase
        .from('expenses')
        .select('amount, categories(name), responsibles(name)')
        .gte('expense_date', from)
        .lte('expense_date', to)

      if (!data || data.length === 0) return `Sin gastos en ${month}/${year}.`

      const total = data.reduce((s, e) => s + e.amount, 0)
      const byCategory: Record<string, number> = {}
      const byResp: Record<string, number> = {}

      for (const e of data) {
        const cat = (e as unknown as { categories?: { name: string } }).categories?.name ?? 'Sin categoría'
        const resp = (e as unknown as { responsibles?: { name: string } }).responsibles?.name ?? 'Sin responsable'
        byCategory[cat] = (byCategory[cat] ?? 0) + e.amount
        byResp[resp] = (byResp[resp] ?? 0) + e.amount
      }

      const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([c, t]) => `${c}: ${formatCLP(t)}`).join(', ')
      const respSummary = Object.entries(byResp)
        .map(([r, t]) => `${r}: ${formatCLP(t)}`).join(', ')

      return `Resumen ${month}/${year}: ${data.length} gastos, total ${formatCLP(total)}\nPor categoría: ${topCats}\nPor responsable: ${respSummary}`
    }

    if (name === 'get_top_expenses') {
      const { from, to, limit = 5 } = input as { from: string; to: string; limit?: number }
      const { data } = await supabase
        .from('expenses')
        .select('amount, detail, vendor, expense_date, categories(name)')
        .gte('expense_date', from)
        .lte('expense_date', to)
        .order('amount', { ascending: false })
        .limit(limit as number)

      if (!data || data.length === 0) return 'Sin gastos en el período.'

      const lines = data.map((e) => {
        const label = e.vendor ?? e.detail ?? (e as unknown as { categories?: { name: string } }).categories?.name ?? 'Gasto'
        return `- ${e.expense_date}: ${label} — ${formatCLP(e.amount)}`
      })

      return `Top ${limit} gastos (${from} al ${to}):\n${lines.join('\n')}`
    }

    return 'Herramienta no reconocida.'
  } catch {
    return 'Error al consultar los datos.'
  }
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_today_expenses',
    description: 'Obtiene todos los gastos de hoy con su detalle y total',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_expenses_by_period',
    description: 'Obtiene gastos filtrados por rango de fechas',
    input_schema: {
      type: 'object' as const,
      properties: {
        from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD' },
        to: { type: 'string', description: 'Fecha fin YYYY-MM-DD' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_expenses_by_category',
    description: 'Total de gastos agrupado por categoría en un período',
    input_schema: {
      type: 'object' as const,
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        category_name: { type: 'string', description: 'Filtrar por una categoría (opcional)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_expenses_by_responsible',
    description: 'Total de gastos por responsable (Mamá, Papá, Otro) en un período',
    input_schema: {
      type: 'object' as const,
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        responsible_name: { type: 'string', description: 'Filtrar por responsable (opcional)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_monthly_summary',
    description: 'Resumen completo de un mes: total, top categorías, por responsable',
    input_schema: {
      type: 'object' as const,
      properties: {
        year: { type: 'number' },
        month: { type: 'number', description: '1-12' },
      },
      required: ['year', 'month'],
    },
  },
  {
    name: 'get_top_expenses',
    description: 'Los N gastos más grandes en un período',
    input_schema: {
      type: 'object' as const,
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        limit: { type: 'number', description: 'Cantidad de gastos (default 5)' },
      },
      required: ['from', 'to'],
    },
  },
]

const SYSTEM = `Eres el asistente del Hostal Santa Elena en Chile. Ayudas a los dueños a entender sus gastos.
Responde en español chileno simple y amigable, como si fuera una conversación familiar.
Usa pesos chilenos (ej: $12.000). Sé conciso pero útil.
Hoy es ${new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
Cuando necesites datos, usa las herramientas disponibles antes de responder.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversationHistory = [] } = req.body as {
    message: string
    conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!message) return res.status(400).json({ error: 'message es requerido' })

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.slice(-10), // últimos 10 mensajes
    { role: 'user', content: message },
  ]

  try {
    // Agentic loop: Claude puede llamar herramientas hasta conseguir la respuesta
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    })

    while (response.stop_reason === 'tool_use') {
      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (tu) => ({
          type: 'tool_result' as const,
          tool_use_id: tu.id,
          content: await executeTool(tu.name, tu.input as Record<string, unknown>),
        }))
      )

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM,
        tools: TOOLS,
        messages,
      })
    }

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return res.status(500).json({ error: 'Error al procesar tu pregunta' })
  }
}
