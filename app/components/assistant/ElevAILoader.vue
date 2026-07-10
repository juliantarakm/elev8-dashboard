<template>
  <div
    class="flex items-center gap-1.5"
    role="status"
    aria-label="Assistant is thinking"
    data-testid="elev-ai-loader"
  >
    <span class="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:-0.3s]" />
    <span class="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:-0.15s]" />
    <span class="size-1.5 rounded-full bg-muted-foreground animate-pulse" />
  </div>
</template>