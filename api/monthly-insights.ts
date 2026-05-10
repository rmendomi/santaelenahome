import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface InsightRequest {
  month: string
  year: number
  categoryTotals: { name: string; amount: number }[]
  responsibleTotals: { name: string; amount: number }[]
  grandTotal: number
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const data = req.body as InsightRequest

  if (!data?.month || !data?.grandTotal) {
    return res.status(400).json({ error: 'Datos incompletos' })
  }

  const summary = [
    `Total del mes: ${formatCLP(data.grandTotal)}`,
    `Gastos por categoría: ${data.categoryTotals.slice(0, 5).map(c => `${c.name} ${formatCLP(c.amount)}`).join(', ')}`,
    `Por responsable: ${data.responsibleTotals.map(r => `${r.name} ${formatCLP(r.amount)}`).join(', ')}`,
  ].join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Eres el asistente del Hostal Santa Elena en Chile. Analiza estos datos de gastos de ${data.month} ${data.year}:

${summary}

Genera exactamente 3 observaciones útiles y amigables para los dueños del hostal.
- Usa español chileno simple y coloquial
- Máximo 2 oraciones por observación
- Sé concreto y útil, no genérico
- Incluye montos cuando sea relevante

Responde SOLO con un array JSON de 3 strings:
["observación 1", "observación 2", "observación 3"]`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return res.status(200).json({ insights })
  } catch (error) {
    console.error('Error generating insights:', error)
    return res.status(500).json({ error: 'Error al generar análisis' })
  }
}
