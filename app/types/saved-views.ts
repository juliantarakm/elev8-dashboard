export interface SavedView {
  id: string
  name: string
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ViewState {
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
}