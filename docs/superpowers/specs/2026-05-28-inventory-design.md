# Inventory Module — Design Spec
**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** v1 — Master Catalog + Per-Listing Inventory

---

## Overview

Inventory adalah modul baru di Elev8 Dashboard untuk melacak barang/perlengkapan properti (permanen dan consumable) per listing. v1 mencakup CRUD master catalog dan manajemen inventory per listing dengan field aset lengkap termasuk dokumen garansi dan info supplier.

---

## Users & Use Cases

| User | Aksi |
|------|------|
| Property Manager / Admin | Kelola master catalog, assign item ke listing, pantau kondisi |
| Housekeeping | (v2) Input kondisi & stok saat cleaning |

---

## Data Model

### `InventoryItem` (Master Catalog)

```ts
interface InventoryDocument {
  name: string
  url: string // base64 atau object URL
  type: 'warranty' | 'receipt' | 'invoice' | 'other'
}

interface InventorySupplier {
  name: string
  contact: string // nomor HP / email
}

interface InventoryItem {
  id: string
  name: string
  category: 'Furniture' | 'Electronics' | 'Linen' | 'Kitchen' | 'Consumable' | 'Other'
  type: 'permanent' | 'consumable'
  unit: string // pcs, set, botol, rol, dll.
  photo?: string // base64
  purchaseValue?: number // IDR
  purchaseDate?: string // YYYY-MM-DD
  warrantyExpiry?: string // YYYY-MM-DD
  documents?: InventoryDocument[]
  supplier?: InventorySupplier
  notes?: string
}
```

### `ListingInventoryEntry` (Per-Listing)

```ts
type ItemCondition = 'good' | 'fair' | 'damaged' | 'missing'

interface ListingInventoryEntry {
  id: string
  itemId: string // ref ke InventoryItem.id
  listingName: string
  quantity: number
  condition: ItemCondition // untuk permanent items
  stockLevel?: number // untuk consumable — jumlah stok saat ini
  notes?: string
  lastUpdated: string // ISO date string
}
```

---

## UI

### Sidebar
- Entry baru di sidebar antara Upsells dan Finance
- Label: **Inventory**
- Icon: `lucide:package`
- Route: `/inventory`

### Page Layout (`app/pages/inventory/index.vue`)
- 2 tab: **Catalog** | **Per-Listing**
- Header dengan page title dan Add button kontekstual per tab

---

### Tab 1: Catalog

**Filter Bar:**
- Kategori pills: All | Furniture | Electronics | Linen | Kitchen | Consumable | Other
- Tipe toggle: All | Permanent | Consumable
- Search input (by nama)

**Table columns:**
| Kolom | Detail |
|-------|--------|
| Foto | Thumbnail kecil atau placeholder icon |
| Nama | Bold |
| Kategori | Badge |
| Tipe | `permanent` / `consumable` chip |
| Unit | Text |
| Harga Beli | IDR format, `—` jika kosong |
| Garansi | Tanggal expired, amber jika < 30 hari, red jika sudah lewat |
| Actions | Edit (pencil icon) / Delete (trash icon) |

**Add/Edit:** Button "Add Item" → buka `InventoryItemDrawer` (Sheet dari kanan)

**`InventoryItemDrawer` fields:**
- Nama item (required)
- Kategori (Select)
- Tipe (RadioGroup: Permanent / Consumable)
- Unit (Input, placeholder: pcs / botol / set)
- Foto upload (FileReader → base64, preview thumbnail)
- Harga beli (IDR, NumberField)
- Tanggal beli (DatePicker)
- Expired garansi (DatePicker)
- Dokumen upload (multi-file: warranty card / struk / invoice / other — label per file)
- Supplier nama + kontak (2 Input fields dalam satu section)
- Notes (Textarea)

---

### Tab 2: Per-Listing

**Filter Bar:**
- Listing select (dropdown — semua listing)
- Kategori pills
- Kondisi filter: All | Good | Fair | Damaged | Missing

**Table columns:**
| Kolom | Detail |
|-------|--------|
| Item | Nama + kategori badge |
| Listing | Nama listing |
| Jumlah | Quantity + unit |
| Kondisi | Badge berwarna (lihat badge spec) |
| Stok Level | Untuk consumable saja, `—` untuk permanent |
| Last Updated | Relative date |
| Actions | Edit / Delete |

**Add Entry:** Button "Add Entry" → buka `ListingInventoryDrawer`

**`ListingInventoryDrawer` fields:**
- Pilih item dari catalog (Combobox searchable)
- Pilih listing (Select)
- Jumlah (NumberField)
- Kondisi (RadioGroup — hanya tampil jika item type = permanent)
- Stok Level (NumberField — hanya tampil jika item type = consumable)
- Notes (Textarea)

---

## Badge Kondisi

| Kondisi | Warna |
|---------|-------|
| `good` | Green (success) |
| `fair` | Amber (warning) |
| `damaged` | Orange (destructive-soft) |
| `missing` | Red (destructive) |

---

## File Structure

```
app/
├── pages/inventory/index.vue
├── components/inventory/
│   ├── InventoryCatalogTab.vue        — tabel + filter bar catalog
│   ├── InventoryListingsTab.vue       — tabel + filter bar per-listing
│   ├── InventoryItemDrawer.vue        — add/edit item catalog (Sheet)
│   ├── ListingInventoryDrawer.vue     — add/edit per-listing entry (Sheet)
│   ├── InventoryFilterBar.vue         — reusable filter bar component
│   └── data/
│       ├── catalog.ts                 — InventoryItem type + mock data (10+ items)
│       └── listing-entries.ts         — ListingInventoryEntry type + mock data
├── composables/
│   ├── useInventoryCatalog.ts         — CRUD catalog, filters, search
│   └── useInventoryListings.ts        — per-listing state, filters
└── constants/menus.ts                 — tambah Inventory entry di sidebar
```

---

## Composables

### `useInventoryCatalog`
```ts
// Key exports:
items: Ref<InventoryItem[]>
filteredItems: ComputedRef<InventoryItem[]>
searchValue: Ref<string>
activeCategoryFilter: Ref<string>
activeTypeFilter: Ref<'all' | 'permanent' | 'consumable'>
addItem(item: Omit<InventoryItem, 'id'>): void
updateItem(id: string, updates: Partial<InventoryItem>): void
deleteItem(id: string): void
getItemById(id: string): InventoryItem | undefined
```

### `useInventoryListings`
```ts
// Key exports:
entries: Ref<ListingInventoryEntry[]>
filteredEntries: ComputedRef<ListingInventoryEntry[]>
filterListing: Ref<string>
filterCategory: Ref<string>
filterCondition: Ref<string>
addEntry(entry: Omit<ListingInventoryEntry, 'id' | 'lastUpdated'>): void
updateEntry(id: string, updates: Partial<ListingInventoryEntry>): void
deleteEntry(id: string): void
```

---

## Mock Data

**catalog.ts** — 10+ item contoh:
- Kasur King (Furniture, permanent, Villa Ubud Retreat)
- Smart TV 55" (Electronics, permanent, warranty 2027-06)
- Set Linen (Linen, permanent)
- Coffee Maker (Kitchen, permanent)
- Sabun Mandi (Consumable, per-botol)
- Shampoo (Consumable, per-botol)
- Tisu Gulung (Consumable, per-rol)
- Kopi Sachet (Consumable, per-sachet)
- Rice Cooker (Kitchen, permanent)
- AC Split (Electronics, permanent, warranty + supplier info)

---

## Warranty Alert Logic

Di `InventoryCatalogTab.vue`:
- Jika `warrantyExpiry` < 30 hari dari sekarang → badge amber "Segera berakhir"
- Jika `warrantyExpiry` sudah lewat → badge red "Garansi habis"
- Jika tidak ada `warrantyExpiry` → tampilkan `—`

---

## Patterns yang Diikuti

- **State:** `useState<T[]>()` dengan spread mutations (sama seperti Upsells, Inbox)
- **Drawer:** `Sheet` component dari shadcn-vue (sama seperti `UpsellDrawer`)
- **File upload:** `FileReader` → base64 (sama seperti `UpsellDrawer` foto upload)
- **Filter:** computed dari reactive state dengan multiple `ref` filters
- **Sidebar:** tambah entry di `app/constants/menus.ts` dengan icon `lucide:package`

---

## Out of Scope (v2)

- Inventory checklist saat cleaning (Housekeeping input via Elev8 Go)
- Restock alert & reorder workflow
- Maintenance log per item
- Asset tagging (nomor aset unik)
- Export inventory report (PDF/CSV)
- Low stock notifications ke Notification Center
