declare module 'cortico/core/language.ts' { export type Language = string; }
declare module 'cortico/core/config-schema.ts' {
  export interface ConfigGroup { id: string; owner: `world:${string}` | 'core' | 'persona' | `provider:${string}`; schema: { type: 'object'; title: string; description?: string; properties: Record<string, Record<string, unknown>> }; }
}
declare module 'cortico/core/types.ts' {
  export interface EventEnvelope { cursor: number; type: string; ts: string; source: string; text: string; meta?: Record<string, unknown>; origin: 'external' | 'internal'; tags?: readonly string[]; }
  export interface EventStoreReader { range(opts?: { fromCursor?: number; toCursor?: number; limit?: number }): EventEnvelope[]; latestCursor(): number; }
  export interface Logger { info(text: string): void; warn(text: string): void; error(text: string): void; debug(text: string): void; }
  export interface WorldHost { store: EventStoreReader; modelFacts: Record<string, unknown>; log: Logger; pushEvent(e: Omit<EventEnvelope, 'cursor' | 'origin'> & { origin?: 'external' | 'internal' }, opts?: Record<string, unknown>): Promise<EventEnvelope>; }
  export interface WorldLamp { label: string; state: 'online' | 'offline' | 'loading' | 'error'; hint?: string; }
  export interface WorldWebUiDecl { label?: string; lamps?: WorldLamp[]; badges?: Array<{ label: string; value: string | number; tone?: 'on' | 'off' | 'plain' }>; panels?: Array<{ id: string; title: string; description?: string; getMethods?: readonly string[] }>; invoke?(panel: string, method: string, args: unknown[]): Promise<unknown>; config?: import('cortico/core/config-schema.ts').ConfigGroup[]; }
  export interface World { id: string; envPromptVars(): Record<string, string> | null | Promise<Record<string, string> | null>; tools(): unknown[]; webUi?(language?: import('cortico/core/language.ts').Language): WorldWebUiDecl; start(host: WorldHost): Promise<void>; stop(): Promise<void>; }
}
declare module 'cortico/world.ts' {
  export interface WorldDescribe { tools: readonly unknown[]; events: readonly unknown[]; }
  export interface WorldContext<S = Record<string, unknown>> { cfg: S; dataDir: string; }
  export interface WorldDefinition<S = Record<string, unknown>> { id: string; label: string; defaults(): S; describe?: WorldDescribe; create(ctx: WorldContext<S>): import('cortico/core/types.ts').World; }
}
