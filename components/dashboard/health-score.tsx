type Props = {
  score: number
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

export function HealthScore({ score }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
      <span className="text-sm text-muted-foreground">/ 100</span>
    </div>
  )
}
