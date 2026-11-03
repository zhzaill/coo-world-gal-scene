import type { Language } from 'cortico/core/language.ts';
import type { EventEnvelope, World, WorldHost, WorldWebUiDecl } from 'cortico/core/types.ts';
import type { WorldContext, WorldDefinition, WorldDescribe } from 'cortico/world.ts';

export const ID = 'gal-scene';
export type SceneMode = 'story' | 'agent';
export interface GalSceneConfig { mode: SceneMode; maxLog: number; }
export const DEFAULTS: GalSceneConfig = { mode: 'story', maxLog: 40 };

const DESCRIBE: WorldDescribe = {
  tools: [],
  events: [{ type: 'gal-scene.input', description: { zh: '场景页提交的一句用户输入。', en: 'A line submitted from the scene page.' }, trigger: 'flush' }],
};

export function activityOf(event: EventEnvelope): string {
  const explicit = event.meta?.activity;
  if (typeof explicit === 'string') return explicit;
  const type = `${event.type} ${event.source} ${event.text}`.toLowerCase();
  if (/approval|question|waiting|询问|批准/.test(type)) return 'waiting';
  if (/error|failed|失败|错误/.test(type)) return 'failed';
  if (/search|browse|fetch|搜索|网页/.test(type)) return 'searching';
  if (/write|edit|create|patch|写入|编辑/.test(type)) return 'writing';
  if (/run|exec|shell|command|terminal|执行/.test(type)) return 'running';
  if (/assistant|reply|answer|回复/.test(type)) return 'done';
  return 'reading';
}

function labelFor(language: Language): string { return language === 'en' ? 'Gal Scene' : '大肥鱼场景'; }

class GalSceneWorld implements World {
  readonly id = ID;
  private host: WorldHost | null = null;
  private mode: SceneMode;
  private maxLog: number;
  private cursor = 0;
  private latest: EventEnvelope[] = [];

  constructor(cfg: GalSceneConfig) { this.mode = cfg.mode; this.maxLog = Math.max(8, Math.min(200, cfg.maxLog)); }
  envPromptVars(): Record<string, string> { return { 'gal.scene': `mode=${this.mode}; latestActivity=${this.latestActivity()}` }; }
  tools(): unknown[] { return []; }
  async start(host: WorldHost): Promise<void> { this.host = host; this.refresh(); }
  async stop(): Promise<void> { this.host = null; this.latest = []; }
  private refresh(): void {
    if (!this.host) return;
    const events = this.host.store.range(this.cursor ? { fromCursor: this.cursor + 1, limit: this.maxLog } : { limit: this.maxLog });
    if (!events.length) return;
    this.cursor = events[events.length - 1].cursor;
    this.latest = [...this.latest, ...events].slice(-this.maxLog);
  }
  private latestActivity(): string { return this.latest.length ? activityOf(this.latest[this.latest.length - 1]) : 'idle'; }
  private state(): Record<string, unknown> {
    this.refresh();
    return {
      mode: this.mode,
      activity: this.latestActivity(),
      events: this.latest.slice(-this.maxLog).map((e) => ({ cursor: e.cursor, type: e.type, ts: e.ts, source: e.source, text: e.text.slice(0, 1000), activity: activityOf(e) })),
    };
  }
  private async send(text: string): Promise<Record<string, unknown>> {
    const line = text.trim().slice(0, 4000);
    if (!line) throw new Error('请输入内容');
    if (!this.host) throw new Error('场景尚未启动');
    await this.host.pushEvent({ type: `${ID}.input`, source: ID, ts: new Date().toISOString(), text: line, meta: { text: line, via: 'gal-scene' } }, { trigger: 'flush' });
    return { ok: true };
  }
  webUi(language: Language = 'zh'): WorldWebUiDecl {
    const isEn = language === 'en';
    return {
      label: labelFor(language),
      lamps: [{ label: isEn ? 'Event stream' : '事件流', state: this.host ? 'online' : 'offline', hint: this.host ? (isEn ? 'Reading Coo event store' : '正在读取 COO 事件库') : (isEn ? 'World is stopped' : '场景未启动') }],
      badges: [{ label: isEn ? 'Activity' : '当前活动', value: this.latestActivity(), tone: this.latestActivity() === 'failed' ? 'off' : 'on' }, { label: isEn ? 'View' : '视图', value: this.mode === 'story' ? (isEn ? 'Story' : '剧情') : (isEn ? 'Agent' : '现场'), tone: 'plain' }],
      panels: [{ id: 'scene', title: isEn ? 'Scene' : '场景', description: isEn ? 'Switch between a short visual novel and live DSH activity.' : '在短篇视觉小说与 DSH 实时活动之间切换。', getMethods: ['state'] }],
      invoke: async (panel, method, args) => {
        if (panel !== 'scene') throw new Error(`unknown panel ${panel}`);
        if (method === 'state') return this.state();
        if (method === 'setMode') { const mode = args[0] === 'agent' ? 'agent' : 'story'; this.mode = mode; return this.state(); }
        if (method === 'send') return this.send(typeof args[0] === 'string' ? args[0] : '');
        throw new Error(`unknown method ${method}`);
      },
    };
  }
}

export const GAL_SCENE: WorldDefinition<GalSceneConfig> = {
  id: ID,
  label: '大肥鱼场景',
  defaults: () => structuredClone(DEFAULTS),
  describe: DESCRIBE,
  create: (ctx: WorldContext<GalSceneConfig>) => new GalSceneWorld(ctx.cfg),
};
export default GAL_SCENE;
