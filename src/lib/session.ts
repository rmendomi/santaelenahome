export interface AppUser {
  id: string
  email: string
  name: string | null
}

const SESSION_KEY = 'app_session'

export function getSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppUser
  } catch {
    return null
  }
}

export function setSession(user: AppUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
