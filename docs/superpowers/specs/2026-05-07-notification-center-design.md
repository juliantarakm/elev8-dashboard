# Notification Center — Design Spec

**Module:** Notification Center (new module)  
**Author:** Juli  
**Scope:** Frontend UI with mock data (no real API integration)  
**Status:** Draft  
**Last updated:** 2026-05-07

---

## 1. Summary

Notification Center menyediakan bell icon di header dengan dropdown popover untuk menampilkan alert real-time CRITICAL dan WARNING. Notifikasi bersifat live — hanya menampilkan alert ACTIVE, bukan history log. Setiap notifikasi mendukung auto-resolve (otomatis hilang) dan manual dismiss, serta navigasi ke halaman relevan saat diklik.

---

## 2. Data Model

### Alert Base Structure

```ts
interface Alert {
  alert_id: string
  type: AlertType
  severity: 'CRITICAL' | 'WARNING'
  status: 'ACTIVE' | 'RESOLVED'
  listing_id: string | null
  property_id: string | null
  triggered_at: string // ISO 8601
  resolved_at: string | null
  auto_resolve: boolean
  resolve_condition: string // human-readable
  context: Record<string, any>
}
```

### Alert Types (18 jenis)

**CRITICAL (11):**
| Type | Display Label | Auto-resolve | Grouping |
|---|---|---|---|
| `SMART_LOCK_DEAD` | Smart Lock — Battery Dead | ✅ | Per property |
| `SMART_LOCK_OFFLINE` | Smart Lock — Offline | ✅ | Per property |
| `SMART_LOCK_CODE_FAILED` | Smart Lock — Access Code Not Generated | ❌ | Per reservation |
| `CHANNEL_DISCONNECTED` | Channel Manager — [Name] Disconnected | ✅ | Per channel |
| `DOUBLE_BOOKING` | Double Booking Detected | ❌ | Per listing |
| `CLEANING_NOT_STARTED_IMMINENT` | Cleaning Not Started — Check-in in 2 Hours | ✅ | Per reservation |
| `CLEANING_NOT_DONE_CHECKIN_PASSED` | Cleaning Incomplete — Guest Checking In Now | ✅ | Per reservation |
| `STRIPE_DISCONNECTED` | Stripe — Payment Connection Lost | ✅ | Tenant-level |
| `DEPOSIT_FAILED_AT_CHECKIN` | Security Deposit — Payment Failed | ❌ | Per reservation |
| `BOOKING_QUOTA_EMPTY` | Booking Quota — 0 Remaining | ✅ | Tenant-level |
| `BRIDGE_OFFLINE` | Elev8 Bridge — Offline | ✅ | Per Bridge device |

**WARNING (7):**
| Type | Display Label | Auto-resolve | Grouping |
|---|---|---|---|
| `SMART_LOCK_BATTERY_CRITICAL` | Smart Lock — Battery Critical | ✅ | Per property |
| `SMART_LOCK_BATTERY_LOW` | Smart Lock — Battery Low | ✅ | Per property |
| `NO_HOUSEKEEPING_ASSIGNED` | No Housekeeping Assigned — Check-out Today | ✅ | Per listing |
| `TASK_OVERDUE` | Task Overdue — [Title] | ✅ | Per task |
| `RATE_PLAN_UNMAPPED` | Booking.com — Rate Plan Unmapped | ✅ | Per listing |
| `BOOKING_QUOTA_LOW` | Booking Quota — Running Low | ✅ | Tenant-level |
| `DYNAMIC_TEMPLATE_FAILED` | Automated Message — Failed to Send | ❌ | Per reservation |

### Escalation Rules

| From | To | Condition |
|---|---|---|
| `SMART_LOCK_BATTERY_LOW` | `SMART_LOCK_BATTERY_CRITICAL` | Battery < 10% |
| `SMART_LOCK_BATTERY_CRITICAL` | `SMART_LOCK_DEAD` | Battery 0% or lock offline |
| `SMART_LOCK_BATTERY_LOW` | Severity → CRITICAL | Check-in within 24h |
| `BOOKING_QUOTA_LOW` | `BOOKING_QUOTA_EMPTY` | Quota reaches 0 |

---

## 3. File Structure

```
app/
├── components/notifications/
│   ├── NotificationCenter.vue     ← Bell icon + dropdown popover
│   ├── NotificationItem.vue       ← Single notification row
│   └── data/alerts.ts             ← Alert types, mock data, helpers
├── composables/
│   └── useNotifications.ts        ← Shared state + actions
└── components/layout/Header.vue   ← Integrates NotificationCenter
```

---

## 4. Component Architecture

### NotificationCenter.vue
- Bell icon (`lucide:bell`) with unread badge (red, count of ACTIVE alerts)
- Positioned in Header.vue before user menu
- Klik bell → opens Popover (not DropdownMenu — konten dinamis)
- Popover width: 380px
- **Header area:** "Notifications" title + "Mark All Read" link (visible only if unread > 0)
- **Filter tabs:** "All" | "Critical" | "Warning" (pill-style tabs)
- **Scroll area:** max-height ~400px, scroll jika overflow
- **Footer:** "View all notifications" link (placeholder untuk halaman dedicated nanti)
- **Empty state:** Icon bell + "No notifications"

### NotificationItem.vue
Props: `alert: Alert`

Layout:
- **Kiri:** Severity indicator — red filled circle (`i-lucide-circle` with `text-red-500`) for CRITICAL, amber (`text-amber-500`) for WARNING
- **Content:**
  - Display label (bold, satu baris)
  - Deskripsi singkat (dari context, satu baris, text-muted-foreground)
  - Timestamp relative ("2m ago", "1h ago")
- **Kanan:** Dismiss button (X — `i-lucide-x`, small icon button)
- **Row background:** `bg-red-50` tint untuk CRITICAL, `bg-amber-50` untuk WARNING
- **Left border:** `border-l-4 border-red-500` / `border-l-4 border-amber-500`
- **Hover:** Brighten background

Behavior:
- **Klik row (body):** `navigateToAlert(alert)` → routing sesuai tipe + mark as read
- **Klik X:** `dismiss(alertId)` — resolve tanpa navigasi
- Auto-resolve: alert dihapus dari dropdown otomatis saat `resolve_condition` terpenuhi (simulasi: setelah N detik untuk mock)

---

## 5. State Management (useNotifications.ts)

### Reactive State
```ts
alerts: Alert[]                           // semua alert (ACTIVE + RESOLVED)
activeAlerts: ComputedRef<Alert[]>        // hanya ACTIVE
unreadCount: ComputedRef<number>          // activeAlerts.length
selectedSeverity: Ref<'all' | 'critical' | 'warning'>
filteredAlerts: ComputedRef<Alert[]>      // activeAlerts filtered by severity
```

### Actions
| Action | Description |
|---|---|
| `markAsRead(id)` | Set status = 'RESOLVED', set resolved_at |
| `markAllAsRead()` | Resolve semua ACTIVE |
| `dismiss(id)` | Sama dengan markAsRead |
| `navigateToAlert(alert)` | Mark as read + router.push berdasarkan mapping |
| `getTimeAgo(isoString)` | Helper: return "2m ago", "1h ago", dll |

### Navigation Mapping (Mock)

| Alert Type Prefix | Route |
|---|---|
| `SMART_LOCK_*` | `/` |
| `CHANNEL_DISCONNECTED` | `/` |
| `DOUBLE_BOOKING` | `/inbox` |
| `CLEANING_*` | `/tasks` |
| `STRIPE_DISCONNECTED` | `/settings/account` |
| `DEPOSIT_*` | `/inbox` |
| `BOOKING_QUOTA_*` | `/` |
| `BRIDGE_OFFLINE` | `/` |
| `NO_HOUSEKEEPING_ASSIGNED` | `/tasks` |
| `TASK_OVERDUE` | `/tasks` |
| `RATE_PLAN_UNMAPPED` | `/` |
| `DYNAMIC_TEMPLATE_FAILED` | `/` |

---

## 6. Severity Visual Reference

| | **CRITICAL** | **WARNING** |
|---|---|---|
| Icon | `text-red-500` filled circle | `text-amber-500` filled circle |
| Row bg | `bg-red-50/50` | `bg-amber-50/50` |
| Hover bg | `bg-red-50` | `bg-amber-50` |
| Left border | `border-l-4 border-red-500` | `border-l-4 border-amber-500` |
| Badge bell | `bg-red-500` | — (count is aggregate) |

---

## 7. Mock Data Strategy

- `data/alerts.ts` berisi 5-8 mock alerts dengan berbagai tipe, severity, dan timestamp
- Beberapa auto-resolve alert akan otomatis berubah status setelah simulated interval (setTimeout ~10-15 detik setelah mounting)
- Ini untuk mendemonstrasikan bahwa notifikasi bisa hilang sendiri tanpa interaksi user
- Mock data mengikuti struktur Alert interface di atas

---

## 8. Integrasi ke Header

Header.vue saat ini:

```vue
<header>
  <SidebarTrigger />
  <div class="ml-auto">
    <LayoutHeaderUserMenu />
  </div>
</header>
```

Menjadi:

```vue
<header>
  <SidebarTrigger />
  <div class="ml-auto flex items-center gap-2">
    <NotificationCenter />
    <LayoutHeaderUserMenu />
  </div>
</header>
```

---

## 9. Fungsi Navigasi

Klik notification row:
1. `markAsRead(alert.alert_id)` — resolve
2. `router.push(routeMap[alert.type])` — navigasi
3. Tutup dropdown

Dismiss (X):
1. `dismiss(alert.alert_id)` — resolve saja
2. Dropdown tetap terbuka

Mark All Read:
1. Loop semua ACTIVE → resolve
2. Dropdown tetap terbuka (langsung kosong — empty state muncul)
