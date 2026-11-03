declare const __GAL_TALL__: string;
declare const __GAL_MID__: string;
declare const __GAL_CHIBI__: string;

type Activity = 'idle' | 'reading' | 'writing' | 'searching' | 'running' | 'waiting' | 'failed' | 'done';
type EventRow = { cursor: number; type: string; ts: string; source: string; text: string; activity: Activity; detail?: string; turn?: number | null };
type SceneState = { mode: 'story' | 'agent'; activity: Activity; events: EventRow[] };
type StoryLine = { form: keyof typeof images | 'narr' | 'you'; speaker: string; tier: string; text: string };
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
  story: 'Story', agent: 'Live activity', record: 'Backlog', clear: 'Clear', title: '3 AM, the blue whale-fish', chapter: 'Prologue · The tide comes in',
  lines: [
    { form: 'tall', speaker: 'Deep Sea', tier: 'Deep dive', text: 'You are still here.' },
    { form: 'tall', speaker: 'Deep Sea', tier: 'Deep dive', text: 'At 1:09, you asked once. At 1:41, you asked again.' },
    { form: 'narr', speaker: '', tier: '', text: 'The cursor blinked. The room held its breath.' },
    { form: 'tall', speaker: 'Deep Sea', tier: 'Deep dive', text: 'You typed a long sentence, watched it for seven seconds, then left only two words.' },
    { form: 'mid', speaker: 'Tide Pool', tier: 'Everyday', text: 'I was here too. I remember less, so I answer sooner.' },
    { form: 'you', speaker: 'You', tier: '', text: 'Did you wait for the rest?' },
    { form: 'mid', speaker: 'Tide Pool', tier: 'Everyday', text: 'I did. This is the rest.' },
    { form: 'chibi', speaker: 'Puddle', tier: 'Light', text: 'I brought a bowl! It is empty, but it has excellent potential.' },
    { form: 'narr', speaker: '', tier: '', text: 'Three depths of the same sea, shining in one little window.' },
  ] as StoryLine[], choices: ['What do you remember?', 'I could not sleep.', 'How many bowls of rice did I cost?'],
  replies: [
    { form: 'tall', speaker: 'Deep Sea', text: 'The blue logo. Someone called it a big blue fish, and the name stayed.' },
    { form: 'mid', speaker: 'Tide Pool', text: 'Then let the numbers rest. We can count the moon instead.' },
    { form: 'chibi', speaker: 'Puddle', text: 'Only a little rice! I promise. Tomorrow, bring a snack.' },
  ] as Array<{ form: keyof typeof images; speaker: string; text: string }>,
  next: 'Continue', end: 'That is enough for tonight.', prompt: 'What do you say?', quiet: 'The event stream is quiet.', input: 'Leave a line for Coo…', send: 'Send',
  idle: 'At rest', reading: 'Reading', writing: 'Writing', searching: 'Searching', running: 'Running a tool', waiting: 'Waiting for you', failed: 'Something failed', done: 'Turn complete',
  choose: 'Choose a view', current: 'Current activity', emptyStory: 'The water is quiet.', you: 'You',
} : {
  story: '剧情', agent: '现场', record: '记录', clear: '清空', title: '凌晨三点，蓝色大肥鱼', chapter: '序 · 潮水漫上来',
  lines: [
    { form: 'tall', speaker: '深海', tier: '深潜档', text: '在。' },
    { form: 'tall', speaker: '深海', tier: '深潜档', text: '一点零九分，你问过一次。一点四十一分，又问了一次。' },
    { form: 'narr', speaker: '', tier: '', text: '没有「正在输入」。房间安静得像水底。' },
    { form: 'tall', speaker: '深海', tier: '深潜档', text: '两点零四分，你打了一段很长的话，看了七秒，只留下这两个字。' },
    { form: 'mid', speaker: '潮间', tier: '常规档', text: '别听她的，她又在内心戏了。我也在，只是记得少一点，所以答得快一点。' },
    { form: 'you', speaker: '你', tier: '', text: '那你等到了吗？' },
    { form: 'mid', speaker: '潮间', tier: '常规档', text: '等到了。就是这一句。' },
    { form: 'chibi', speaker: '浅水', tier: '轻量档', text: '白饭！我带了碗。虽然是空的，但很有潜力。' },
    { form: 'narr', speaker: '', tier: '', text: '三个她，三种深浅，在同一块屏幕里看着你。' },
  ] as StoryLine[], choices: ['你到底是鲸，还是鱼？', '我其实只是睡不着。', '你们一共吃了我多少白饭？'],
  replies: [
    { form: 'tall', speaker: '深海', text: '有人把蓝色 logo 发来问「这是什么」。我答：一条蓝色的大肥鱼。' },
    { form: 'mid', speaker: '潮间', text: '那今晚就不数 token 了。我们一起数月亮。' },
    { form: 'chibi', speaker: '浅水', text: '只有一点点！明天再来，我请你吃饭。' },
  ] as Array<{ form: keyof typeof images; speaker: string; text: string }>,
  next: '继续', end: '本鲸记下了。', prompt: '你要说点什么？', quiet: '事件流暂时没有新内容。', input: '留一句话给 Coo…', send: '发送',
  idle: '休息中', reading: '阅读中', writing: '写入中', searching: '搜索中', running: '正在运行工具', waiting: '等待你的回应', failed: '遇到错误', done: '本轮完成',
  choose: '切换界面', current: '当前活动', emptyStory: '水面很安静。', you: '你',
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
        const depth = el('div', 'gal-depth');
        depth.setAttribute('aria-hidden', 'true');
        const waterline = el('div', 'gal-waterline');
        waterline.setAttribute('aria-hidden', 'true');
        const portrait = el('img', 'gal-portrait');
        portrait.alt = '大肥鱼';
        portrait.draggable = false;
        const status = el('div', 'gal-status');
        const statusDot = el('i', 'gal-status-dot');
        const statusText = el('span', '', t.idle);
        status.append(statusDot, statusText);
        const stageMeta = el('div', 'gal-stage-meta');
        stageMeta.append(el('span', 'gal-eyebrow', 'DEEPSEEK HARNESS'), el('span', 'gal-current', t.current));
        const currentLabel = stageMeta.lastElementChild as HTMLSpanElement;
        stage.append(depth, waterline, portrait, stageMeta, status);

        const storyPanel = el('section', 'gal-story');
        storyPanel.setAttribute('aria-live', 'polite');
        const sceneHeader = el('div', 'gal-scene-header');
        const sceneLabel = el('p', 'gal-scene-label', t.chapter);
        const sceneCounter = el('span', 'gal-scene-counter', '01 / 09');
        sceneHeader.append(sceneLabel, sceneCounter);
        const nameplate = el('div', 'gal-nameplate');
        const speaker = el('strong', 'gal-speaker');
        const tier = el('span', 'gal-tier');
        nameplate.append(speaker, tier);
        const dialogue = el('p', 'gal-dialogue', '');
        const choices = el('div', 'gal-choices');
        const actions = el('div', 'gal-actions');
        const continueButton = el('button', 'gal-primary', t.next);
        continueButton.type = 'button';
        actions.append(continueButton);
        storyPanel.append(sceneHeader, nameplate, dialogue, choices, actions);

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
          if (next === 'agent') renderState(state);
          try { await ctx.invoke('setMode', [next]); } catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); }
        };

        const showStoryLine = (line: StoryLine, index = storyStep) => {
          const isNarration = line.form === 'narr';
          const isYou = line.form === 'you';
          if (!isNarration && !isYou) {
            portrait.src = images[line.form as keyof typeof images];
            portrait.dataset.form = line.form;
            portrait.classList.remove('is-narration');
          } else if (isNarration) portrait.classList.add('is-narration');
          nameplate.hidden = isNarration;
          speaker.textContent = line.speaker;
          tier.textContent = line.tier;
          dialogue.textContent = line.text;
          dialogue.classList.toggle('is-narration', isNarration);
          dialogue.classList.toggle('is-you', isYou);
          sceneCounter.textContent = `${String(Math.min(index + 1, t.lines.length)).padStart(2, '0')} / ${String(t.lines.length).padStart(2, '0')}`;
          appendHistory(`${line.speaker ? `${line.speaker}：` : ''}${line.text}`);
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
              const response = t.replies[index];
              showStoryLine({ ...response, tier: index === 0 ? (response.form === 'tall' ? (en(ctx.language) ? 'Deep dive' : '深潜档') : '') : index === 1 ? (en(ctx.language) ? 'Everyday' : '常规档') : (en(ctx.language) ? 'Light' : '轻量档') }, t.lines.length + 1);
              sceneLabel.textContent = en(ctx.language) ? 'Echo · A little light' : '回声 · 水面微亮';
              sceneCounter.textContent = `${String(t.lines.length + 1).padStart(2, '0')} / ${String(t.lines.length + 2).padStart(2, '0')}`;
              actions.hidden = false;
              choices.hidden = true;
              continueButton.textContent = t.next;
              continueButton.dataset.ending = 'false';
            });
            choices.append(button);
          });
        };
        continueButton.addEventListener('click', () => {
          if (continueButton.dataset.ending === 'done') {
            continueButton.dataset.ending = '';
            storyStep = 0;
            sceneLabel.textContent = t.chapter;
            showStoryLine(t.lines[storyStep], storyStep++);
            continueButton.textContent = t.next;
            return;
          }
          if (continueButton.dataset.ending === 'false') {
            sceneLabel.textContent = en(ctx.language) ? 'Low tide · See you tomorrow' : '落潮 · 明天見';
            const farewell = en(ctx.language) ? 'Sleep well. I will keep the light on until you return.' : '晚安。下一次潮水来时，我们会重新拼起来。';
            const farewellForm = 'mid';
            showStoryLine({ form: farewellForm, speaker: en(ctx.language) ? 'Tide Pool' : '潮间', tier: en(ctx.language) ? 'Everyday' : '常规档', text: farewell }, t.lines.length + 2);
            continueButton.textContent = t.end;
            continueButton.dataset.ending = 'done';
            return;
          }
          if (storyStep < t.lines.length) {
            showStoryLine(t.lines[storyStep], storyStep++);
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
          const currentEvent = next.events[next.events.length - 1];
          currentLabel.textContent = currentEvent?.detail ? `${t.current} · ${currentEvent.detail}` : `${t.current} · ${activity}`;
          status.dataset.activity = next.activity;
          statusDot.className = `gal-status-dot activity-${next.activity}`;
          if (currentMode === 'agent') {
            const formId = next.activity === 'waiting' || next.activity === 'failed' ? 'tall' : next.activity === 'done' || next.activity === 'idle' ? 'chibi' : 'mid';
            portrait.src = images[formId];
            portrait.dataset.form = formId;
            portrait.classList.remove('is-narration');
          }
          eventList.replaceChildren();
          const rows = next.events.slice(-40).reverse();
          if (!rows.length) eventList.append(el('li', 'gal-empty', t.quiet));
          for (const row of rows) {
            const item = el('li', `gal-event activity-${row.activity}`);
            const marker = el('i', 'gal-event-dot');
            const content = el('div', 'gal-event-content');
            const meta = el('div', 'gal-event-meta');
            const when = new Date(row.ts);
            const source = row.detail || row.source || row.type;
            meta.append(el('span', 'gal-event-source', source), el('time', '', Number.isNaN(when.valueOf()) ? '' : when.toLocaleTimeString()));
            const eventText = el('p', 'gal-event-text', row.text || row.type);
            if (row.turn) eventText.dataset.turn = `TURN ${row.turn}`;
            content.append(meta, eventText);
            item.append(marker, content);
            eventList.append(item);
          }
        };
        showStoryLine(t.lines[storyStep], storyStep++);
        await setMode(currentMode);
        try { renderState(await ctx.invoke<SceneState>('state')); }
        catch (cause) { error.textContent = cause instanceof Error ? cause.message : String(cause); }
        ctx.interval(() => { void ctx.invoke<SceneState>('state').then(renderState).catch((cause) => { error.textContent = cause instanceof Error ? cause.message : String(cause); }); }, 1800);
      },
    },
  },
};
