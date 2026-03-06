import { UsageStats } from '@/components/usage/UsageStats'

export const runtime = 'edge'

export default function UsagePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <UsageStats />
    </div>
  )
}
