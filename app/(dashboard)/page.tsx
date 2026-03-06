import { Analyzer } from '@/components/analyzer/Analyzer'

export const runtime = 'edge'

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Analyzer />
    </div>
  )
}
