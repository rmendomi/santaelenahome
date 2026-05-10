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

  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' })
  }

  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .select('id, email, name, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    name: user.name,
  })
}
