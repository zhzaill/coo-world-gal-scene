declare const __GAL_TALL__: string;
declare const __GAL_MID__: string;
declare const __GAL_CHIBI__: string;

type Activity = 'idle' | 'reading' | 'writing' | 'searching' | 'running' | 'waiting' | 'failed' | 'done';
type EventRow = { cursor: number; type: string; ts: string; source: string; text: string; activity: Activity };
type SceneState = { mode: 'story' | 'agent'; activity: Activity; events: EventRow[] };
type Context = {
  root: HTMLElement;
  language: string;
  invoke<T>(method: string, args?: unknown[]): Promise<T>;
  interval(fn: () => void, ms: number): void;
  own?(resource: { dispose(): void }): void;
};

const images = { tall: __GAL_TALL__, mid: __GAL_MID__, chibi: __GAL_CHIBI__ };
const en = (language: string) => language !== 'zh' && language !== 'zh-Hant';
const copy = (language: string) => en(language) ? {
  story: 'Story', agent: 'Live activity', record: 'Backlog', clear: 'Clear', title: '3 AM, the blue whale-fish',
  intro: 'The city has gone quiet. The little light in the chat window is still awake.',
  lines: [
    ['tall', 'You are still here. I kept the unfinished sentence warm.'],
    ['mid', 'No need to turn tonight into a task. We can just sit by the water.'],
    ['chibi', 'I brought a bowl! It is empty, but it has excellent potential.'],
  ] as [keyof typeof images, string][], choices: ['Tell me what you remember.', 'I cannot sleep yet.', 'Let us call it a night.'],
  next: 'Continue', end: 'That is enough for tonight.', prompt: 'Your choice', quiet: 'Nothing in the event stream yet.', input: 'Leave a line for Coo…', send: 'Send',
  idle: 'At rest', reading: 'Reading', writing: 'Writing', searching: 'Searching', running: 'Running a tool', waiting: 'Waiting for you', failed: 'Something failed', done: 'Turn complete',
  choose: 'Choose a view', current: 'Current activity', emptyStory: 'The water is quiet.',
} : {
  story: '剧情', agent: '现场', record: '记录', clear: '清空', title: '凌晨三点，蓝色大肥鱼',
  intro: '城市安静下来。对话框里那一点光，还没有睡。',
  lines: [
    ['tall', '你还在呀。我把那句没说完的话，替你留着。'],
    ['mid', '今晚不用把一切都变成任务。我们坐一会儿就好。'],
    ['chibi', '我带了饭碗！虽然是空的，但很有潜力。'],
  ] as [keyof typeof images, string][], choices: ['说说你记得什么。', '我还睡不着。', '今晚就到这里吧。'],
  next: '继续', end: '今晚这样就很好。', prompt: '你想怎么回答？', quiet: '事件流暂时没有新内容。', input: '留一句话给 Coo…', send: '发送',
  idle: '休息中', reading: '阅读中', writing: '写入中', searching: '搜索中', running: '正在运行工具', waiting: '等待你的回应', failed: '遇到错误', done: '本轮完成',
  choose: '切换界面', current: '当前活动', emptyStory: '水面很安静。',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export default {
  panels: {
    scene: {
      async mount(ctx: Context): Promise<void> {
        const t = copy(ctx.language);
        const root = el('section', 'gal-scene-root');
        root.setAttribute('aria-label', '大肥鱼场景');
        const header = el('header', 'gal-header');
        const title = el('h2', 'gal-title', t.title);
        const mode = el('div', 'gal-mode');
        mode.setAttribute('role', 'group');
        mode.setAttribute('aria-label', t.choose);
        const storyButton = el('button', 'gal-mode-button', t.story);
        storyButton.type = 'button';
        const agentButton = el('button', 'gal-mode-button', t.agent);
        agentButton.type = 'button';
        mode.append(storyButton, agentButton);
        const logButton = el('button', 'gal-icon-button', '≡');
        logButton.type = 'button';
        logButton.title = t.record;
        logButton.setAttribute('aria-label', t.record);
        header.append(title, mode, logButton);

        const stage = el('div', 'gal-stage');
        const portrait = el('img', 'gal-portrait');
        portrait.alt = '大肥鱼';
        portrait.draggable = false;
        const status = el('div', 'gal-status');
        const statusDot = el('i', 'gal-status-dot');
        const statusText = el('span', '', t.idle);
        status.append(statusDot, statusText);
        const stageMeta = el('div', 'gal-stage-meta');
        stageMeta.append(el('span', 'gal-eyebrow', 'DEEPSEEK HARNESS'), el('span', 'gal-current', t.current));
        stage.append(portrait, stageMeta, status);

        const storyPanel = el('section', 'gal-story');
        storyPanel.setAttribute('aria-live', 'polite');
        const sceneLabel = el('p', 'gal-scene-label', '序 · 潮水漫上来');
        const dialogue = el('p', 'gal-dialogue', t.intro);
        const choices = el('div', 'gal-choices');
        const actions = el('div', 'gal-actions');
        const continueButton = el('button', 'gal-primary', t.next);
        continueButton.type = 'button';
        actions.append(continueButton);
        storyPanel.append(sceneLabel, dialogue, choices, actions);

        const agentPanel = el('section', 'gal-agent', '');
        const eventList = el('ol', 'gal-events');
        const form = el('form', 'gal-compose');
        const input = el('input', 'gal-input');
        input.type = 'text';
        input.maxLength = 4000;
        input.placeholder = t.input;
        input.setAttribute('aria-label', t.input);
        const sendButton = el('button', 'gal-send', t.send);
        sendButton.type = 'submit';
        form.append(input, sendButton);
        agentPanel.append(eventList, form);

        const backlog = el('aside', 'gal-backlog');
        backlog.hidden = true;
        const backlogHead = el('div', 'gal-backlog-head');
        backlogHead.append(el('h3', '', t.record));
        const clearButton = el('button', 'gal-text-button', t.clear);
        clearButton.type = 'button';
        const closeButton = el('button', 'gal-icon-button', '×');
        closeButton.type = 'button';
        closeButton.title = en(ctx.language) ? 'Close backlog' : '关闭记录';
        closeButton.setAttribute('aria-label', closeButton.title);
        backlogHead.append(clearButton, closeButton);
        const backlogList = el('ol', 'gal-backlog-list');
        backlog.append(backlogHead, backlogList);
        const error = el('p', 'gal-error');
        error.setAttribute('role', 'status');
        root.append(header, stage, storyPanel, agentPanel, error, backlog);
        ctx.root.replaceChildren(root);

        const saved = (() => { try { return JSON.parse(localStorage.getItem('gal-scene-log') || '[]') as string[]; } catch { return []; } })();
        const history = saved.slice(-80);
        let storyStep = 0;
        let currentMode: 'story' | 'agent' = localStorage.getItem('gal-scene-mode') === 'agent' ? 'agent' : 'story';
        let state: SceneState = { mode: currentMode, activity: 'idle', events: [] };
        const appendHistory = (line: string) => {
          history.push(line);
          while (history.length > 80) history.shift();
          try { localStorage.setItem('gal-scene-log', JSON.stringify(history)); } catch { /* storage may be disabled */ }
          renderHistory();
        };
        const renderHistory = () => {
          backlogList.replaceChildren(...history.map((line) => el('li', '', line)));
        };
        renderHistory();

        const setMode = async (next: 'story' | 'agent') => {
          currentMode = next;
          localStorage.setItem('gal-scene-mode', next);
          storyButton.setAttribute('aria-pressed', String(next === 'story'));
          agentButton.setAttribute('aria-pressed', String(next === 'agent'));
          storyPanel.hidden = next !== 'story';
          agentPanel.hidden = next !== 'agent';
          stage.classList.toggle('is-agent', next === 'agent');
          try { await ctx.invoke('setMode', [next]); } catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); }
        };

        const showStoryLine = (formId: keyof typeof images, text: string) => {
          portrait.src = images[formId];
          portrait.dataset.form = formId;
          dialogue.textContent = text;
          appendHistory(text);
        };
        const showChoices = () => {
          choices.replaceChildren();
          choices.hidden = false;
          actions.hidden = true;
          choices.append(el('p', 'gal-choice-prompt', t.prompt));
          t.choices.forEach((label, index) => {
            const button = el('button', 'gal-choice', `${index + 1}. ${label}`);
            button.type = 'button';
            button.addEventListener('click', () => {
              appendHistory(`你：${label}`);
              const reply = index === 0 ? 'tall' : index === 1 ? 'mid' : 'chibi';
              const line = index === 0 ? '我记得你每次回来时，屏幕都会先亮一下。' : index === 1 ? '那就慢慢呼吸。我在这里，不赶时间。' : '好！我把这一小片海留盏灯。晚安。';
              showStoryLine(reply, line);
              sceneLabel.textContent = index === 2 ? '落潮 · 明天见' : '回声 · 水面微亮';
              dialogue.classList.add('is-reply');
              actions.hidden = false;
              choices.hidden = true;
              continueButton.textContent = index === 2 ? t.end : t.next;
              continueButton.dataset.ending = 'true';
            });
            choices.append(button);
          });
        };
        continueButton.addEventListener('click', () => {
          if (continueButton.dataset.ending === 'true') {
            continueButton.dataset.ending = '';
            storyStep = 0;
            sceneLabel.textContent = '序 · 潮水漫上来';
            dialogue.classList.remove('is-reply');
            showStoryLine('tall', t.intro);
            continueButton.textContent = t.next;
            return;
          }
          if (storyStep < t.lines.length) {
            const [formId, text] = t.lines[storyStep++];
            showStoryLine(formId, text);
          } else showChoices();
        });
        storyButton.addEventListener('click', () => void setMode('story'));
        agentButton.addEventListener('click', () => void setMode('agent'));
        logButton.addEventListener('click', () => { backlog.hidden = !backlog.hidden; });
        closeButton.addEventListener('click', () => { backlog.hidden = true; });
        clearButton.addEventListener('click', () => { history.splice(0); localStorage.removeItem('gal-scene-log'); renderHistory(); });
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const line = input.value.trim();
          if (!line) return;
          sendButton.disabled = true;
          error.textContent = '';
          try {
            await ctx.invoke('send', [line]);
            appendHistory(`你：${line}`);
            input.value = '';
          } catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); }
          finally { sendButton.disabled = false; }
        });

        const renderState = (next: SceneState) => {
          state = next;
          const activity = next.activity in t ? t[next.activity as keyof typeof t] as string : t.idle;
          statusText.textContent = activity;
          status.dataset.activity = next.activity;
          const formId = next.activity === 'waiting' || next.activity === 'failed' ? 'tall' : next.activity === 'done' || next.activity === 'idle' ? 'chibi' : 'mid';
          portrait.src = images[formId];
          portrait.dataset.form = formId;
          statusDot.className = `gal-status-dot activity-${next.activity}`;
          eventList.replaceChildren();
          const rows = next.events.slice(-40).reverse();
          if (!rows.length) eventList.append(el('li', 'gal-empty', t.quiet));
          for (const row of rows) {
            const item = el('li', `gal-event activity-${row.activity}`);
            const marker = el('i', 'gal-event-dot');
            const content = el('div', 'gal-event-content');
            const meta = el('div', 'gal-event-meta');
            const when = new Date(row.ts);
            meta.append(el('span', 'gal-event-source', row.source || row.type), el('time', '', Number.isNaN(when.valueOf()) ? '' : when.toLocaleTimeString()));
            content.append(meta, el('p', 'gal-event-text', row.text || row.type));
            item.append(marker, content);
            eventList.append(item);
          }
        };
        await setMode(currentMode);
        try { renderState(await ctx.invoke<SceneState>('state')); }
        catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); }
        ctx.interval(() => { void ctx.invoke<SceneState>('state').then(renderState).catch((cause) => { error.textContent = cause instanceof Error ? cause.message : String(cause); }); }, 1800);
      },
    },
  },
};
