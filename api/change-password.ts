import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, currentPassword, newPassword } = req.body as {
    userId?: string
    currentPassword?: string
    newPassword?: string
  }

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Datos incompletos' })
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .select('id, password_hash')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta' })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  const { error: updateError } = await supabaseAdmin
    .from('app_users')
    .update({ password_hash: newHash })
    .eq('id', userId)

  if (updateError) {
    return res.status(500).json({ error: 'No se pudo actualizar la contraseña' })
  }

  return res.status(200).json({ success: true })
}
