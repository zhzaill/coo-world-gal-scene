import test from 'node:test';
import assert from 'node:assert/strict';
import definition, { activityOf } from '../src/index.ts';

const event = (patch = {}) => ({ cursor: 1, type: 'tool.call', ts: '2026-11-03T00:00:00.000Z', source: 'dsh', text: '', origin: 'external', ...patch });

test('maps DSH-GAL activity metadata and common event text deterministically', () => {
  assert.equal(activityOf(event({ meta: { activity: 'waiting' } })), 'waiting');
  assert.equal(activityOf(event({ type: 'tool.error', text: 'command failed' })), 'failed');
  assert.equal(activityOf(event({ type: 'tool.search', text: 'searching the web' })), 'searching');
  assert.equal(activityOf(event({ type: 'tool.call', text: 'str_replace_editor' })), 'writing');
  assert.equal(activityOf(event({ type: 'assistant.reply', text: 'done' })), 'done');
  assert.equal(activityOf(event()), 'reading');
});

test('declares one switchable panel and exposes recent stored events', async () => {
  const rows = [event({ cursor: 4, text: 'first' }), event({ cursor: 5, text: 'second' })];
  const ranges = [];
  const pushed = [];
  const world = definition.create({ cfg: { mode: 'story', maxLog: 40 }, dataDir: 'unused' });
  await world.start({
    store: { range(opts) { ranges.push(opts); return opts.fromCursor ? rows.filter((r) => r.cursor >= opts.fromCursor) : rows; }, latestCursor() { return 5; } },
    modelFacts: {}, log: { info() {}, warn() {}, error() {}, debug() {} },
    async pushEvent(e, opts) { pushed.push({ e, opts }); return { ...e, cursor: 6, origin: 'external' }; },
  });
  const ui = world.webUi('zh');
  assert.deepEqual(ui.panels.map((panel) => panel.id), ['scene']);
  assert.equal(ui.panels[0].getMethods.includes('state'), true);
  const state = await ui.invoke('scene', 'state', []);
  assert.equal(state.activity, 'reading');
  assert.deepEqual(state.events.map((row) => row.text), ['first', 'second']);
  await ui.invoke('scene', 'setMode', ['agent']);
  assert.equal((await ui.invoke('scene', 'state', [])).mode, 'agent');
  await ui.invoke('scene', 'send', ['  hello Coo  ']);
  assert.equal(pushed[0].e.text, 'hello Coo');
  assert.equal(pushed[0].opts.trigger, 'flush');
  assert.equal(ranges.length >= 1, true);
  await assert.rejects(() => ui.invoke('scene', 'send', ['  ']), /请输入内容/);
  await world.stop();
});
