import { getRankingView, buildInsights } from '@/features/rankings/services/rankings-service'

try {
  const view = await getRankingView('overall')
  console.log('OK type', view.type, 'rows', view.results.length)
  console.log('row0', JSON.stringify(view.results[0], null, 2))
  console.log('insights', buildInsights(view.results).map((i) => `${i.title}:${i.entries.length}`))
} catch (e) {
  console.error('FAIL', e)
}
