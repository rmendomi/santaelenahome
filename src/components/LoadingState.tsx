interface LoadingStateProps {
  message?: string
  fullPage?: boolean
}

export function LoadingState({ message = 'Cargando...', fullPage = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
