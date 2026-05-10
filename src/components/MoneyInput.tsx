import { useRef, useEffect } from 'react'
import { formatCLP } from '@/utils/formatters'

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  autoFocus?: boolean
  error?: string
}

export function MoneyInput({ value, onChange, placeholder = '$ 0', autoFocus = false, error }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [autoFocus])

  const displayValue = value > 0 ? formatCLP(value) : ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    onChange(parseInt(raw, 10) || 0)
  }

  return (
    <div>
      <div className={`relative ${error ? 'ring-2 ring-danger rounded-2xl' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full text-4xl font-bold text-center py-6 px-4 bg-white rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none text-gray-900 placeholder-gray-300"
        />
      </div>
      {error && <p className="text-danger text-sm mt-1 text-center">{error}</p>}
    </div>
  )
}
