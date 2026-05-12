<template>
  <div class="flex flex-col gap-4">
    <Tabs default-value="reservations">
      <TabsList class="w-fit">
        <TabsTrigger value="reservations">
          Reservations
        </TabsTrigger>
        <TabsTrigger value="upsell">
          Upsell
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reservations" class="mt-4">
        <FinanceReservationsTab />
      </TabsContent>

      <TabsContent value="upsell" class="mt-4">
        <FinanceUpsellTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
