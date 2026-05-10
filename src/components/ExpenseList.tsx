import { EmptyState } from './EmptyState'
import { ExpenseCard } from './ExpenseCard'
import type { ExpenseWithRelations } from '@/types/database'

interface ExpenseListProps {
  expenses: ExpenseWithRelations[]
  onEdit: (expense: ExpenseWithRelations) => void
  onDeleted: () => void
  showDate?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function ExpenseList({
  expenses,
  onEdit,
  onDeleted,
  showDate = false,
  emptyTitle = 'Sin gastos',
  emptyDescription = 'Agrega tu primer gasto del día.',
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return <EmptyState icon="💸" title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDeleted={onDeleted}
          showDate={showDate}
        />
      ))}
    </div>
  )
}
