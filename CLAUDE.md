# CLAUDE.md — Elev8 Dashboard AI Design System

> **Stack**: Nuxt 3 + Vue 3 + shadcn-vue + Tailwind CSS v4
> **Project**: elev8-dashboard — Property management for Bali vacation rentals
> **Current User**: Komang Juliantara (Guest Relations role)

---

## 🏗️ Project Overview

**Elev8** is a web dashboard for managing Bali vacation rental properties. Built with **Nuxt 3**, **Vue 3**, **shadcn-vue**, and **Tailwind CSS v4**.

### Main Modules
- **Inbox** — Guest messaging system (4-panel layout) with Phone call tab
- **Notification Center** — Bell icon in header with dropdown for CRITICAL/WARNING alerts
- **Kanban** — Task board
- **Tasks** — Data table with filtering (TanStack table)
- **Settings** — Profile, appearance, notifications, account
- **Auth** — Login, register, OTP, forgot password
- **Mail** — Email interface (demo)
- **Components Gallery** — All shadcn-vue component demos

---

## 👤 Current User Context

The logged-in user is **Komang Juliantara** (Guest Relations role), NOT "You" (Admin).

- `staff-1` / "You" in mock data = property owner
- Komang = active staff member viewing the dashboard
- This affects how you reference users in mock data vs. UI

---

## 📚 Key Documentation

- **Inbox Module Changelog** → `docs/superpowers/changelogs/2025-04-25-inbox-module.md`
- **Inbox Quick Reference** → `docs/superpowers/changelogs/2025-04-25-inbox-quick-ref.md`
- **Notification Center Spec** → `docs/superpowers/specs/2026-05-07-notification-center-design.md`
- **Notification Center Plan** → `docs/superpowers/plans/2026-05-07-notification-center-plan.md`

---

## 📊 Architecture Quick Reference

### Inbox Module (`app/components/inbox/`)

#### Data + Types (`app/components/inbox/data/conversations.ts`)
- `Conversation` type with `status: ConversationStatus | null`, `assignedTo?: string | null`, `tags: string[]`
- `Message` type with `aiWritten?: boolean`, `senderRole?: string`
- `StaffMember` list: You/Admin, Komang Juliantara/Guest Relations, Made Surya/Housekeeping, Wayan Adi/Maintenance
- `Reservation` type + mock data (6 conversations)

#### Shared State (`app/composables/useInbox.ts`)
- **Reactive**: `conversations` uses `useState<Conversation[]>` — mutations MUST use spread syntax to trigger Vue reactivity
- **Filters**:
  - `showActionNeeded` — boolean toggle
  - `assignedToMeFilter` — boolean
  - `activeStayFilter` — boolean
  - `activeListingFilter` — multi-select `string[]` (empty = no filter). Checkboxes in sidebar. Selected listings shown as removable chips.
  - `activeTagFilters` — multi-select `string[]` (AND logic). Tags button opens searchable Popover with checkboxes. Selected tags shown as removable chips.
  - `listingSearchText`, `searchValue`, `sortBy`
- **Actions**: `markAsHandled()`, `markAsUnread()`, `assignTo()`, `getAssignedStaff()`, `toggleListingFilter()`, `clearListingFilters()`, `toggleTagFilter()`, `clearTagFilters()`, `clearAllListingFilters()`, ElevAI toggle functions
- **Auto-read**: Selecting a conversation sets `unreadCount = 0`
- **Key type**: `ConversationStatus = 'action_needed'` (nullable — `null` = no action needed)
- **Phone**: `getPhoneCalls(conversationId)` returns `PhoneCall[]` for the conversation

#### Phone Call Features
- `PhoneCall` interface with `direction`, `status`, `duration`, `transcript`, `summary`, `recording_url`
- Phone tab in Thread.vue — call history with transcript expand/collapse, download recording
- Call summaries in Notes tab (tagged ElevAI for AI consumption)
- Phone call entries in Activity timeline with Send button for unsent templates

### Notification Center Module (`app/components/notifications/`)

#### Data + Types (`app/components/notifications/data/alerts.ts`)
- `AlertType` — 18 alert types (SMART_LOCK_DEAD, CLEANING_NOT_STARTED_IMMINENT, STRIPE_DISCONNECTED, etc.)
- `AlertSeverity` — `'CRITICAL' | 'WARNING'`
- `Alert` interface with `alert_id`, `type`, `severity`, `status`, `triggered_at`, `auto_resolve`, `context`
- `alertDisplayLabels`, `alertRouteMap`, `getDescription()`, `mockAlerts` (7 mock alerts)

#### Shared State (`app/composables/useNotifications.ts`)
- `alerts` — `useState<Alert[]>` with spread syntax for reactivity
- Computed: `activeAlerts`, `unreadCount`, `filteredAlerts` (by severity)
- Actions: `markAsRead()`, `markAllAsRead()`, `dismiss()`, `navigateToAlert()`
- Severity filter: `selectedSeverity` ref (`'all' | 'critical' | 'warning'`)

#### Components
- **NotificationCenter.vue** — Bell icon in Header with unread Badge, Popover dropdown with filter tabs (All/Critical/Warning), ScrollArea list
- **NotificationItem.vue** — Single alert row with severity-based coloring (red/amber), keyboard accessible, dismiss + navigate actions

### Layout (`app/components/layout/`)
- **Header.vue** — SidebarTrigger + user menu (no breadcrumb)
- **HeaderUserMenu.vue** — Komang Juliantara + "Guest Relations" role dropdown
- **AppSidebar.vue** — No footer (user menu moved to topbar)
- **SidebarNavLink.vue** — Unread count badge on Inbox link

### Tasks Module (`app/components/tasks/`)
- **DataTable.vue** — TanStack table wrapper
- **DataTableToolbar.vue**, **DataTableFacetedFilter.vue**, **DataTablePagination.vue**, **DataTableViewOptions.vue**, **DataTableColumnHeader.vue**, **DataTableRowActions.vue**
- Schema: `app/components/tasks/data/schema.ts`
- Mock data: `app/components/tasks/data/data.ts`
- Columns: `app/components/tasks/components/columns.ts`

### Kanban Module (`app/components/kanban/`)
- **KanbanBoard.vue** — Main board component
- Composable: `app/composables/useKanban.ts`

### Settings (`app/components/settings/`)
- **Layout.vue** — Settings page shell
- **AccountForm.vue**, **AppearanceForm.vue**, **DisplayForm.vue**, **NotificationsForm.vue**, **ProfileForm.vue**
- **SidebarNav.vue** — Settings sub-navigation

### Auth (`app/components/auth/`)
- **SignIn.vue**, **SignUp.vue**, **OTPForm.vue**, **OTPForm1.vue**, **OTPForm2.vue**, **ForgotPassword.vue**
- Layout: `app/components/layout/Auth.vue`

### Mail (`app/components/mail/`)
- **Layout.vue**, **List.vue**, **Display.vue**, **Nav.vue**, **AccountSwitcher.vue**
- Mock data: `app/components/mail/data/mails.ts`

---

## 🎨 UI Patterns

### Toast Notifications
- Uses `vue-sonner` (already configured in `app.vue`)
- Call `toast.success("Message saved")` / `toast.info("New message")` for user action feedback

### Unread Badges
- `Badge` component with `variant="default"` showing count
- Applied on: sidebar Inbox link, per-conversation in list

### AI-Written Messages
- `aiWritten: true` on host messages → shows:
  - "ElevAI" as sender name
  - Sparkle avatar
  - "AI" label instead of user name

### Action Needed Status
- Only `action_needed` or `null` (NO `needs_reply`, `waiting_on_guest`, `done`)
- Badge shown ONLY when `status === 'action_needed'` (destructive variant)

### Date Range Picker
- `app/components/base/DateRangePicker.vue`
- Used for filtering reservations by date range

### Search
- `app/components/Search.vue` — Global search component
- `app/components/PasswordInput.vue` — Password input with visibility toggle

---

## 🧩 Component Selection Hierarchy

When building UI, ALWAYS select components in this order:

### 1. shadcn-vue Components (atoms/primitives)
Located in `app/components/ui/` — **CHECK HERE FIRST**.

Most commonly used:
- **Basic**: `Button`, `Input`, `Label`, `Badge`, `Textarea`
- **Overlay**: `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `AlertDialog`, `Drawer`, `HoverCard`, `Tooltip`, `ContextMenu`, `Command`, `Menubar`, `NavigationMenu`
- **Forms**: `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Calendar`, `DatePicker`, `RangeCalendar`, `PinInput`, `NumberField`, `TagsInput`, `Combobox`
- **Data Display**: `Table`, `DataTable`, `Tabs`, `Accordion`, `Collapsible`, `Separator`, `ScrollArea`, `AspectRatio`, `Resizable`, `Progress`, `Skeleton`, `Stepper`, `Toggle`, `ToggleGroup`, `Avatar`, `Breadcrumb`, `Card`, `Carousel`, `Kbd`, `Pagination`
- **Feedback**: `Alert`, `Sonner` (toast), `Toast`
- **Layout**: `Sidebar` (from `layout/AppSidebar.vue` wrapper)

> ⚠️ **Never duplicate shadcn components**. Customize via:
> - Props (`variant`, `size`, `class`)
> - Slots (override content)
> - `cn()` utility for class merging

### 2. Custom Base Components
- `app/components/base/BreadcrumbCustom.vue`
- `app/components/base/DateRangePicker.vue`
- `app/components/Search.vue`
- `app/components/PasswordInput.vue`
- `app/components/AppSettings.vue`
- `app/components/DarkToggle.vue`
- `app/components/ThemeCustomize.vue`

### 3. Module-Specific Components
- **Inbox**: `inbox/Layout`, `inbox/List`, `inbox/Thread`, `inbox/ReplyBox`, `inbox/Nav`, `inbox/ActionCard`, etc.
- **Layout**: `layout/AppSidebar`, `layout/Header`, `layout/HeaderUserMenu`, `layout/Auth`
- **Auth**: `auth/SignIn`, `auth/SignUp`, `auth/OTPForm`
- **Tasks**: `tasks/components/DataTable` (complex TanStack table wrapper)
- **Kanban**: `kanban/KanbanBoard`
- **Settings**: `settings/Layout`, `settings/AccountForm`, etc.
- **Mail**: `mail/Layout`, `mail/List`, `mail/Display`

### 4. Build New (Last Resort)
Only when no existing component fits. Place in appropriate folder:
- `components/atoms/` — single element (future)
- `components/molecules/` — combination of atoms (future)
- `components/organisms/` — complex sections (future)
- Or alongside existing module: `components/<module>/NewComponent.vue`

---

## 🧱 shadcn-vue Usage Patterns

### Button Variants
```vue
<!-- Primary action -->
<Button>Save</Button>

<!-- Destructive action -->
<Button variant="destructive">Delete</Button>

<!-- Secondary / Cancel -->
<Button variant="outline">Cancel</Button>

<!-- Ghost / Icon only -->
<Button variant="ghost" size="icon"><Icon /></Button>

<!-- Link style -->
<Button variant="link">Learn more</Button>

<!-- With loading state -->
<Button :disabled="isLoading">
  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
  Submit
</Button>
```

### Dialog Pattern
```vue
<Dialog v-model:open="isOpen">
  <DialogTrigger as-child>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description of what this dialog does.</DialogDescription>
    </DialogHeader>
    <!-- Body content -->
    <DialogFooter>
      <Button variant="outline" @click="isOpen = false">Cancel</Button>
      <Button @click="handleConfirm">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Pattern (vee-validate + zod)
```vue
<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const formSchema = toTypedSchema(z.object({
  username: z.string().min(2).max(50),
}))

const onSubmit = (values) => {
  console.log('Form submitted!', values)
}
</script>

<template>
  <Form v-slot="{ handleSubmit }" :validation-schema="formSchema">
    <form @submit="handleSubmit($event, onSubmit)">
      <FormField v-slot="{ componentField }" name="username">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input type="text" placeholder="shadcn" v-bind="componentField" />
          </FormControl>
          <FormDescription>This is your public display name.</FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
      <Button type="submit">Submit</Button>
    </form>
  </Form>
</template>
```

### Sheet (Slide-over) Pattern
```vue
<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Open Sheet</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit profile</SheetTitle>
      <SheetDescription>Make changes to your profile here.</SheetDescription>
    </SheetHeader>
    <!-- Content -->
    <SheetFooter>
      <SheetClose as-child>
        <Button type="submit">Save changes</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### DataTable (TanStack)
```vue
<script setup>
import { useVueTable, getCoreRowModel } from '@tanstack/vue-table'

const table = useVueTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

---

## 🎨 Tailwind & Styling Rules

- **NO arbitrary colors** → use CSS variables: `bg-primary`, `text-destructive-foreground`, `bg-muted`, `text-muted-foreground`
- **ElevAI gold ONLY**: `bg-[#C8A84B]` for ElevAI branding; `bg-warning` for host chat bubbles and toggle
- **Responsive** → mobile-first (`md:`, `lg:`, `xl:`)
- **Spacing** → Tailwind scale: `p-4`, `gap-2`, `mb-6`, `space-y-4`
- **Dark mode** → handled automatically via `.dark` class + CSS variables in `app/assets/css/themes.css`
- **Merge classes** → always use `cn()` from `@/lib/utils`
- **No hardcoded colors** except ElevAI gold

### Common Utility Patterns
```vue
<!-- Container -->
<div class="flex flex-col gap-4 p-6">

<!-- Card-like container -->
<div class="rounded-lg border bg-card text-card-foreground shadow-sm">

<!-- Flex center -->
<div class="flex items-center justify-center">

<!-- Text hierarchy -->
<h2 class="text-2xl font-bold tracking-tight">Title</h2>
<p class="text-sm text-muted-foreground">Description</p>
```

---

## 🔌 Composables Reference

| Composable | File | Usage | Key Exports |
|-----------|------|-------|-------------|
| `useInbox` | `app/composables/useInbox.ts` | Inbox module state | `conversations`, filters, `markAsHandled()`, `assignTo()`, `toggleListingFilter()`, `clearTagFilters()`, `getPhoneCalls()` |
| `useNotifications` | `app/composables/useNotifications.ts` | Notification Center | `alerts`, `unreadCount`, `filteredAlerts`, `markAsRead()`, `markAllAsRead()`, `dismiss()`, `navigateToAlert()` |
| `useKanban` | `app/composables/useKanban.ts` | Kanban board state | columns, cards, drag handlers |
| `useAppSettings` | `app/composables/useAppSettings.ts` | Theme/settings | dark mode, sidebar state, settings preferences |
| `useShortcuts` | `app/composables/useShortcuts.ts` | Keyboard shortcuts | `defineShortcuts` wrapper |

### State Management Rules
- **Inbox conversations**: `useState<Conversation[]>()` — reactive, persists per request
- **Mutations**: ALWAYS use spread syntax:
  ```ts
  conversations.value = conversations.value.map(
    c => c.id === id ? { ...c, status: null, unreadCount: 0 } : c
  )
  ```
- **Filters**: Computed from reactive state (multi-select arrays)
- **Avoid direct mutation**: ❌ `conv.status = null` → ✅ spread replace

---

## 🖼️ Icon Rules

- **Default**: `lucide:` prefix via `lucide-vue-next`
  ```vue
  <Icon icon="lucide:user-check" />
  ```
- **OTA logos**: `logos:airbnb`, `simple-icons:bookingdotcom`
- **Custom icons**: Add to `app/components/ui/icon/` if needed

---

## 📁 File Structure Reference

```
app/
├── app.config.ts              # App config (shadcn-vue)
├── app.vue                    # Root app with Sonner/Toaster
├── assets/
│   └── css/
│       ├── tailwind.css       # Tailwind entry
│       └── themes.css         # Theme tokens (light/dark)
├── components/
│   ├── ui/                    ← shadcn-vue components (338 files)
│   ├── AppSettings.vue
│   ├── DarkToggle.vue
│   ├── PasswordInput.vue
│   ├── Search.vue
│   ├── ThemeCustomize.vue
│   ├── auth/
│   │   ├── ForgotPassword.vue
│   │   ├── OTPForm.vue
│   │   ├── OTPForm1.vue
│   │   ├── OTPForm2.vue
│   │   ├── SignIn.vue
│   │   └── SignUp.vue
│   ├── base/
│   │   ├── BreadcrumbCustom.vue
│   │   └── DateRangePicker.vue
│   ├── dashboard/
│   │   └── TotalVisitors.vue
│   ├── inbox/
│   │   ├── ActionCard.vue
│   │   ├── GuestSentiment.vue
│   │   ├── HostbuddySuggestion.vue
│   │   ├── Layout.vue
│   │   ├── List.vue
│   │   ├── ListItem.vue
│   │   ├── Nav.vue
│   │   ├── ReplyBox.vue
│   │   ├── ReservationActivity.vue
│   │   ├── ReservationGuest.vue
│   │   ├── ReservationListing.vue
│   │   ├── ReservationPanel.vue
│   │   ├── ReservationSummary.vue
│   │   ├── ReservationTasks.vue
│   │   ├── Thread.vue          ← Phone tab with call history
│   │   └── data/
│   │       └── conversations.ts ← PhoneCall, phoneCalls data
│   ├── notifications/          ← Notification Center (new)
│   │   ├── NotificationCenter.vue
│   │   ├── NotificationItem.vue
│   │   └── data/
│   │       └── alerts.ts       ← Alert types + mock data
│   ├── kanban/
│   │   └── KanbanBoard.vue
│   ├── layout/
│   │   ├── AppSidebar.vue
│   │   ├── Auth.vue
│   │   ├── Header.vue
│   │   ├── HeaderUserMenu.vue
│   │   ├── SidebarNavFooter.vue
│   │   ├── SidebarNavGroup.vue
│   │   ├── SidebarNavHeader.vue
│   │   └── SidebarNavLink.vue
│   ├── mail/
│   │   ├── AccountSwitcher.vue
│   │   ├── Display.vue
│   │   ├── Layout.vue
│   │   ├── List.vue
│   │   ├── Nav.vue
│   │   └── data/
│   │       └── mails.ts
│   ├── navigation-menu/
│   │   └── DemoItem.vue
│   ├── settings/
│   │   ├── AccountForm.vue
│   │   ├── AppearanceForm.vue
│   │   ├── DisplayForm.vue
│   │   ├── Layout.vue
│   │   ├── NotificationsForm.vue
│   │   ├── ProfileForm.vue
│   │   └── SidebarNav.vue
│   └── tasks/
│       ├── components/
│       │   ├── columns.ts
│       │   ├── DataTable.vue
│       │   ├── DataTableColumnHeader.vue
│       │   ├── DataTableFacetedFilter.vue
│       │   ├── DataTablePagination.vue
│       │   ├── DataTableRowActions.vue
│       │   ├── DataTableToolbar.vue
│       │   └── DataTableViewOptions.vue
│       └── data/
│           ├── data.ts
│           └── schema.ts
├── composables/
│   ├── defineShortcuts.ts
│   ├── useAppSettings.ts
│   ├── useInbox.ts
│   ├── useKanban.ts
│   ├── useNotifications.ts  ← Notification Center state
│   └── useShortcuts.ts
├── layouts/
│   ├── blank.vue              # Auth pages
│   └── default.vue            # Main app layout
├── lib/
│   └── utils.ts               # cn(), formatDate(), etc.
└── pages/
    ├── (auth)/
    │   ├── forgot-password.vue
    │   ├── login-basic.vue
    │   ├── login.vue
    │   ├── otp-1.vue
    │   ├── otp-2.vue
    │   ├── otp.vue
    │   └── register.vue
    ├── (error)/
    │   ├── 401.vue
    │   ├── 403.vue
    │   ├── 404.vue
    │   ├── 500.vue
    │   └── 503.vue
    ├── components/            # Component demo pages
    │   ├── accordion.vue
    │   ├── alert-dialog.vue
    │   ├── alert.vue
    │   ├── ... (all shadcn demos)
    │   └── tooltip.vue
    ├── email.vue
    ├── inbox.vue
    ├── index.vue               # Dashboard home
    ├── kanban.vue
    ├── settings/
    │   ├── account.vue
    │   ├── appearance.vue
    │   ├── display.vue
    │   ├── notifications.vue
    │   └── profile.vue
    └── tasks.vue
```

---

## 🚫 Anti-Patterns

- ❌ **Clone HTML** from existing component → **import & compose**
- ❌ Use `<a>` for internal navigation → **use `<NuxtLink>` or `<NuxtLinkLocale>`**
- ❌ Hardcode colors → **use theme tokens** (`bg-primary`, `text-muted-foreground`)
- ❌ Import shadcn components from elsewhere → **use `@/components/ui/`**
- ❌ Mutate state directly (`conv.status = null`) → **use spread syntax for reactivity**
- ❌ Create new component when shadcn exists → **customize existing via props/slots**
- ❌ Use raw HTML for layouts → **compose with existing molecules/organisms**
- ❌ Forget aria-labels on icon-only buttons → **always add accessible labels**

---

## 🐛 Debugging Tips

- **Adoption report mismatch?** → Check `codebase-index.json` freshness; regenerate via script
- **Component marked unused but you know it's used?** → Verify imports use full path (not stem collision)
- **Reactivity issue?** → Check spread syntax in mutations; avoid direct property assignment
- **Style not applying?** → Check `cn()` merge order; ensure dark mode class is set
- **shadcn component not working?** → Check `app.config.ts` for component registration; verify import path
- **Build errors?** → Check `components.json` for shadcn-vue config; verify `lib/utils.ts` exports

---

## 🔄 Regeneration Instructions

When adding/removing major components or refactoring structure:

1. Run codebase scanner to update `codebase-index.json`
2. Update `component-metadata/` for new components
3. Add new composables to Composables Reference
4. Update File Structure if folders change
5. Check Anti-Patterns — any new ones discovered?

---

*Generated from AGENTS.md + codebase scan. Keep updated as project evolves.*
