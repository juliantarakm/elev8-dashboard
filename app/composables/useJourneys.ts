import type { Journey, JourneyStatus } from '~/components/journeys/data/journeys'
import { mockJourneys } from '~/components/journeys/data/journeys'

export function useJourneys() {
  const journeys = useState<Journey[]>('journeys', () => mockJourneys)

  function toggleStatus(id: string) {
    journeys.value = journeys.value.map(j =>
      j.id === id
        ? { ...j, status: (j.status === 'active' ? 'inactive' : 'active') as JourneyStatus }
        : j
    )
  }

  function saveJourney(journey: Journey) {
    const exists = journeys.value.find(j => j.id === journey.id)
    if (exists) {
      journeys.value = journeys.value.map(j =>
        j.id === journey.id
          ? { ...journey, lastModified: new Date().toISOString().split('T')[0] }
          : j
      )
    } else {
      journeys.value = [
        ...journeys.value,
        { ...journey, lastModified: new Date().toISOString().split('T')[0] },
      ]
    }
  }

  function deleteJourney(id: string) {
    journeys.value = journeys.value.filter(j => j.id !== id)
  }

  return { journeys, toggleStatus, saveJourney, deleteJourney }
}
