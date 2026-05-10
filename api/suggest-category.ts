import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { detail, categories } = req.body as {
    detail: string
    categories: string[]
  }

  if (!detail || !categories?.length) {
    return res.status(400).json({ error: 'detail y categories son requeridos' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Eres el clasificador de gastos del Hostal Santa Elena en Chile.
Dado este detalle de gasto: "${detail}"
Categorías disponibles: ${categories.join(', ')}

Responde SOLO con el nombre exacto de la categoría más apropiada, sin puntos, sin explicación.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const matched = categories.find((c) => c.toLowerCase() === text.toLowerCase())

    return res.status(200).json({ category: matched ?? categories[categories.length - 1] })
  } catch (error) {
    console.error('Error suggesting category:', error)
    return res.status(500).json({ error: 'Error al sugerir categoría' })
  }
}
