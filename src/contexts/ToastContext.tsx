import { createContext, useContext } from 'react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface ToastContextValue {
  showSuccess: (msg: string) => void
  showError: (msg: string) => void
  showInfo: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  return useContext(ToastContext)
}
