import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageBase64, mimeType } = req.body as {
    imageBase64: string
    mimeType: string
  }

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 y mimeType son requeridos' })
  }

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validMimeTypes.includes(mimeType)) {
    return res.status(400).json({ error: 'Tipo de imagen no soportado' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analiza esta boleta o ticket chileno y extrae la información en formato JSON.

Responde SOLO con un objeto JSON válido, sin texto adicional, con esta estructura:
{
  "vendor": "nombre del comercio o null",
  "date": "fecha en formato YYYY-MM-DD o null",
  "total": número entero en pesos chilenos o null,
  "items": [
    {
      "name": "nombre del producto",
      "amount": número entero en pesos chilenos,
      "suggestedCategory": "una de: Limpieza|Desayuno|Supermercado|Gas|Lavandería|Mantención|Servicios|Verduras|Pan|Otros"
    }
  ]
}

Si no puedes leer claramente algún campo, usa null. Los montos deben ser enteros (sin decimales).`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(422).json({ error: 'No se pudo extraer información de la boleta' })
    }

    const data = JSON.parse(jsonMatch[0])
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error analyzing receipt:', error)
    return res.status(500).json({ error: 'Error al analizar la boleta' })
  }
}
