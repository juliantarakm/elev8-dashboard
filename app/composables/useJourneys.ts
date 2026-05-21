import type { Journey, JourneyStatus, JourneyGroup } from '~/components/journeys/data/journeys'
import { mockJourneys, mockGroups } from '~/components/journeys/data/journeys'

export function useJourneys() {
  const journeys = useState<Journey[]>('journeys', () => mockJourneys)
  const groups = useState<JourneyGroup[]>('journey-groups', () => mockGroups)

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
    groups.value = groups.value.map(g => ({
      ...g,
      journeyIds: g.journeyIds.filter(jid => jid !== id),
    }))
  }

  // --- Group management ---

  function createGroup(name: string, journeyIds: string[] = []) {
    const id = `g-${Date.now()}`
    if (journeyIds.length > 0) {
      groups.value = groups.value.map(g => ({
        ...g,
        journeyIds: g.journeyIds.filter(jid => !journeyIds.includes(jid)),
      }))
    }
    groups.value = [...groups.value, { id, name, journeyIds: [...journeyIds], collapsed: false }]
  }

  function deleteGroup(id: string) {
    groups.value = groups.value.filter(g => g.id !== id)
  }

  function renameGroup(id: string, name: string) {
    groups.value = groups.value.map(g => g.id === id ? { ...g, name } : g)
  }

  function toggleGroupCollapse(id: string) {
    groups.value = groups.value.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
  }

  function moveJourneyToGroup(journeyId: string, groupId: string | null) {
    groups.value = groups.value.map(g => ({
      ...g,
      journeyIds: g.journeyIds.filter(jid => jid !== journeyId),
    }))
    if (groupId) {
      groups.value = groups.value.map(g =>
        g.id === groupId ? { ...g, journeyIds: [...g.journeyIds, journeyId] } : g
      )
    }
  }

  function addJourneysToGroup(groupId: string, journeyIds: string[]) {
    groups.value = groups.value.map(g => ({
      ...g,
      journeyIds: g.journeyIds.filter(jid => !journeyIds.includes(jid)),
    }))
    groups.value = groups.value.map(g =>
      g.id === groupId ? { ...g, journeyIds: [...g.journeyIds, ...journeyIds] } : g
    )
  }

  return {
    journeys, toggleStatus, saveJourney, deleteJourney,
    groups, createGroup, deleteGroup, renameGroup, toggleGroupCollapse,
    moveJourneyToGroup, addJourneysToGroup,
  }
}
