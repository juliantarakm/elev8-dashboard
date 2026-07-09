import type { GuideSubmission } from '~/components/guest-guides/data/types'

export function useGuestGuideSubmissions() {
  const submissions = useState<GuideSubmission[]>('guest-guide-submissions', () => [])

  function addSubmission(s: GuideSubmission): void {
    submissions.value = [...submissions.value.filter(x => x.linkId !== s.linkId), s]
  }

  function getSubmissionForLink(linkId: string): GuideSubmission | null {
    return submissions.value.find(s => s.linkId === linkId) ?? null
  }

  return { submissions, addSubmission, getSubmissionForLink }
}
