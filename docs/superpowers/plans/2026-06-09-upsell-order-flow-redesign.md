# Upsell Order Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy single order status with explicit approval, payment, and fulfillment states so by-request upsells can be approved, paid manually or via link, and progressed while in service.

**Architecture:** Keep the upsell order data source as the single source of truth, but split lifecycle into three independent status axes: approval, payment, and fulfillment. Add small helper functions in the data module to derive display labels, badges, and action availability from those axes so the table and drawer can stay simple. Reuse the existing notifications composable to emit request, approval, payment, decline, and completion events.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS, vue-sonner

---

### Task 1: Redesign the upsell order data model

**Files:**
- Modify: `app/components/upsells/data/upsell-orders.ts`

- [ ] **Step 1: Replace the legacy `status` union with `approvalStatus`, `paymentStatus`, and `fulfillmentStatus` on `UpsellOrder`, and add display helpers for labels and colors.**
- [ ] **Step 2: Update the mock orders so each record has explicit lifecycle state and the rental motor example uses `paid` plus `in_progress`.**
- [ ] **Step 3: Verify the file typechecks by running `pnpm typecheck`.**

### Task 2: Move order state transitions into the composable

**Files:**
- Modify: `app/composables/useUpsellOrders.ts`

- [ ] **Step 1: Add helpers for approving, declining, reopening, marking paid, marking payment pending, starting fulfillment, and completing fulfillment.**
- [ ] **Step 2: Keep filter and KPI logic derived from the new lifecycle axes so existing table badges and counters stay accurate.**
- [ ] **Step 3: Verify by running `pnpm typecheck`.**

### Task 3: Update the orders table and drawer UI

**Files:**
- Modify: `app/components/upsells/UpsellOrderTable.vue`
- Modify: `app/components/upsells/UpsellOrderDrawer.vue`
- Modify: `app/pages/upsells.vue`

- [ ] **Step 1: Replace legacy status labels, filters, and action menus with approval/payment/fulfillment-aware UI.**
- [ ] **Step 2: Remove the duplicate cancel action in the drawer and expose the correct approve, decline, manual paid, in-progress, and complete actions.**
- [ ] **Step 3: Verify by running `pnpm lint` and `pnpm typecheck`.**

### Task 4: Align notifications with the new workflow

**Files:**
- Modify: `app/components/upsells/data/upsell-notifications.ts`
- Modify: `app/composables/useUpsellNotifications.ts`

- [ ] **Step 1: Add notification types for approval, payment, decline reopen, and fulfillment milestones.**
- [ ] **Step 2: Create the matching helper calls from the new order transitions.**
- [ ] **Step 3: Verify by running `pnpm typecheck`.**
