// Gemini Free Tier - No cost
export function calcCostUsd(_inputTokens: number, _outputTokens: number): number {
  return 0
}

export function formatCostUsd(costUsd: number): string {
  if (costUsd < 0.001) return `$${(costUsd * 1000).toFixed(4)}m` // milli-dollar
  return `$${costUsd.toFixed(4)}`
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return tokens.toString()
}
