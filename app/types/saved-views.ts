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
  isDefault?: boolean // Marks Default view as immutable
}

export interface ViewState {
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
}

export const DEFAULT_VIEW: SavedView = {
  id: 'default',
  name: 'Default View',
  searchValue: '',
  activeTagFilter: [],
  activeAiFilter: null,
  columnVisibility: {
    amenities: false,
    room: false,
  },
  pageSize: 15,
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDefault: true,
}
