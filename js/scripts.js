/* ─── Config ─── */
const TYPING_BASE     = 450;
const TYPING_PER_CHAR = 22;
const TYPING_MAX      = 1700;
const TYPING_CARD     = 900;
const AFTER_BASE      = 380;
const AFTER_PER_CHAR  = 8;

/* ─── Reduced motion ─── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Time-of-day sign-off ─── */
function getSignOff() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const t = h + m * 0.01;
  if (t >= 5  && t < 19) return 'Have a nice day';
  if (t >= 19 && t < 22) return 'Have a nice evening';
  return 'Have a good night';
}

/* ─── Message definitions ─── */
function buildMessages() {
  return [
    { type: 'text',  text: 'Hey there 👋' },
    { type: 'text',  text: 'I\'m Karan Patel' },
    { type: 'text',  text: 'I\'m a software engineer at Capital One' },
    { type: 'text',  text: 'Here\'s where you can find me:' },
    { type: 'email', html: '<a href="mailto:inbox.kpatel@gmail.com">inbox.kpatel@gmail.com</a>' },
    {
      type:       'card',
      href:       'https://www.linkedin.com/in/karanpatel1501/',
      imageClass: 'linkedin-bg',
      imageSrc:   'img/linkedin.svg',
      imageAlt:   'LinkedIn logo',
      title:      'Karan Patel | LinkedIn',
      domain:     'linkedin.com',
    },
    {
      type:       'card',
      href:       'https://github.com/Karanpatel-15',
      imageClass: 'github-bg',
      imageSrc:   'img/github.svg',
      imageAlt:   'GitHub logo',
      title:      'Karanpatel-15 · GitHub',
      domain:     'github.com',
    },
    {
      type:       'card',
      href:       'pdf/Karan_Patel_Resume.pdf',
      imageClass: 'resume-bg',
      imageSrc:   'img/resume-preview.svg',
      imageAlt:   'First page of resume',
      title:      'Karan_Patel_Resume.pdf',
      domain:     'PDF · 88 KB',
      target:     '_self',
    },
    { type: 'text', text: getSignOff() },
    { type: 'text', text: '- Karan.' },
  ];
}

/* ─── Helpers ─── */
function typingDelay(msg) {
  if (msg.type === 'card') return TYPING_CARD;
  const len = (msg.text || msg.html || '').replace(/<[^>]+>/g, '').length;
  return Math.min(TYPING_BASE + len * TYPING_PER_CHAR, TYPING_MAX);
}

function afterDelay(msg) {
  const len = (msg.text || msg.html || '').replace(/<[^>]+>/g, '').length;
  return AFTER_BASE + len * AFTER_PER_CHAR;
}

/* ─── Pop-in using Web Animations API ─── */
function popIn(el) {
  if (reducedMotion) return;
  el.animate(
    [
      { transform: 'scale(0.35)', opacity: '0',   offset: 0    },
      { transform: 'scale(1.07)', opacity: '1',   offset: 0.6  },
      { transform: 'scale(0.97)',                  offset: 0.82 },
      { transform: 'scale(1)',                     offset: 1    },
    ],
    { duration: 320, easing: 'ease-out', fill: 'both' }
  );
}

/* ─── Build a link-card <a> element ─── */
function buildCard(msg) {
  const a = document.createElement('a');
  a.className = 'link-card';
  a.href = msg.href;
  a.target = msg.target || '_blank';
  a.rel = 'noopener noreferrer';

  const imgWrap = document.createElement('div');
  imgWrap.className = `card-image ${msg.imageClass}`;

  const img = document.createElement('img');
  img.src = msg.imageSrc;
  img.alt = msg.imageAlt;
  img.width  = (msg.imageClass === 'resume-bg') ? 260 : 56;
  img.height = (msg.imageClass === 'resume-bg') ? 140 : 56;
  imgWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'card-body';
  /* safe: title and domain are hardcoded strings, not user input */
  body.innerHTML =
    `<div class="card-title">${msg.title}</div>` +
    `<div class="card-domain">${msg.domain}</div>`;

  a.appendChild(imgWrap);
  a.appendChild(body);
  return a;
}

/* ─── Create a bubble-row DOM node ─── */
function createBubbleRow(msg, { withTail = false, afterCard = false } = {}) {
  const row = document.createElement('div');
  row.className = 'bubble-row';
  if (afterCard) row.classList.add('after-card');

  const bubble = document.createElement('div');
  bubble.className = 'bubble left';
  if (withTail && msg.type !== 'card') bubble.classList.add('tail');
  if (msg.type === 'card')            bubble.classList.add('card');

  if (msg.type === 'card') {
    bubble.appendChild(buildCard(msg));
  } else if (msg.type === 'email') {
    bubble.innerHTML = msg.html;
  } else {
    /* Plain text — sanitize before inserting */
    bubble.textContent = msg.text;
  }

  row.appendChild(bubble);
  return row;
}

/* ─── Sync tail: only the last text bubble has the tail class ─── */
function syncTails(thread) {
  const textBubbles = [...thread.querySelectorAll('.bubble.left:not(.card)')];
  textBubbles.forEach((b, i) => {
    if (i < textBubbles.length - 1) b.classList.remove('tail');
    else                             b.classList.add('tail');
  });
}

/* ─── Smooth scroll to bottom of thread ─── */
function scrollToBottom(thread) {
  thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
}

/* ─── Reduced-motion path: show everything at once ─── */
function showAllImmediate(thread) {
  const msgs = buildMessages();
  msgs.forEach((msg) => {
    const row = createBubbleRow(msg);
    thread.appendChild(row);
  });
  syncTails(thread);
  thread.scrollTop = thread.scrollHeight;
}

/* ─── Animated path: sequence messages one by one ─── */
function scheduleMessages(thread, msgs, index, prevTextBubble, prevWasCard) {
  if (index >= msgs.length) return;
  const msg = msgs[index];

  /* Show typing indicator */
  const typingRow = document.createElement('div');
  typingRow.className = 'typing-row';
  const typingBubble = document.createElement('div');
  typingBubble.className = 'typing-bubble';
  typingBubble.setAttribute('aria-label', 'Karan is typing');
  typingBubble.innerHTML =
    '<div class="typing-dots">' +
      '<span class="typing-dot"></span>' +
      '<span class="typing-dot"></span>' +
      '<span class="typing-dot"></span>' +
    '</div>';
  typingRow.appendChild(typingBubble);
  thread.appendChild(typingRow);
  popIn(typingBubble);
  scrollToBottom(thread);

  setTimeout(() => {
    /* Remove typing indicator */
    if (typingRow.parentNode) thread.removeChild(typingRow);

    const afterCard = !!prevWasCard;
    const row = createBubbleRow(msg, { withTail: true, afterCard });
    thread.appendChild(row);

    /* Previous text bubble loses its tail when a new text one arrives */
    if (prevTextBubble && msg.type !== 'card') {
      prevTextBubble.classList.remove('tail');
    }

    const thisBubble = row.querySelector('.bubble');
    const nextPrevText = (msg.type !== 'card') ? thisBubble : prevTextBubble;
    const nextPrevWasCard = msg.type === 'card';

    popIn(thisBubble);
    scrollToBottom(thread);

    setTimeout(() => {
      scheduleMessages(thread, msgs, index + 1, nextPrevText, nextPrevWasCard);
    }, afterDelay(msg));

  }, typingDelay(msg));
}

/* ─── Init ─── */
function init() {
  const thread = document.querySelector('.message-thread');

  /* Thread timestamp */
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const tsDiv = document.createElement('div');
  tsDiv.className = 'thread-timestamp';
  const strong = document.createElement('strong');
  strong.textContent = 'Today';
  tsDiv.appendChild(strong);
  tsDiv.appendChild(document.createTextNode(' ' + timeStr));
  thread.appendChild(tsDiv);

  /* Live status-bar clock (desktop frame only) */
  const statusTime = document.querySelector('.status-time');
  if (statusTime) {
    const tick = () => {
      const t = new Date();
      statusTime.textContent = t.toLocaleTimeString('en-US',
        { hour: 'numeric', minute: '2-digit', hour12: true });
    };
    tick();
    setInterval(tick, 1000);
  }

  if (reducedMotion) {
    showAllImmediate(thread);
  } else {
    scheduleMessages(thread, buildMessages(), 0, null, false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
