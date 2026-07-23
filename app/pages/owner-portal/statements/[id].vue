<script setup lang="ts">
import PortalStatementDetail from '~/components/owner-portal/PortalStatementDetail.vue'

const route = useRoute()
const statementId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <PortalStatementDetail :statement-id="statementId" />
</template>
