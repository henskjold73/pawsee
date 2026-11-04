// Turns a free-form prompt into a short, readable card title. Returns null when the prompt carries no topic
// ("yes", "ok", "now?"), so the previous title can stay.
const FILLER = /^(?:hey|hi|hello|ok(?:ay)?|right|alright|yeah|so|well|now|and|but|also|then|please|pls|can you|could you|would you|will you|i want you to|i want to|i need you to|i need to|we need to|we should|we could|we can|let'?s|lets|go ahead and|try to|probably|maybe|just|actually|basically)\b[\s,:-]*/i;
const NO_TOPIC = /^(?:y(?:es|ep|eah)?|n(?:o|ope)?|ok(?:ay)?|sure|thanks?|thank you|go|continue|proceed|do it|next|done|good|great|nice|cool|lgtm|now|and now|then|what now|why|how|what|really)\W*$/i;
const LABEL = /^(?:task|goal|objective|request|question|issue|problem|bug|context|ask)\s*:\s*/i;
const CODE_START = /^\s*(?:const|let|var|import|export|function|class|interface|type|return|if|for|<\/?[a-z]|[{}()[\]]|\/\/|\/\*|@\w+)/;

export function titleFromPrompt(text, max = 52) {
  let t = String(text ?? '').replace(/```[\s\S]*?```/g, ' ').trim();
  const firstLine = t.split('\n').map(l => l.trim()).find(Boolean) || '';
  if (!firstLine) return null;
  if (/^<\/?[a-z_]+[\s>]/i.test(firstLine)) return null;                // injected notifications / markup, not a prompt
  if (CODE_START.test(firstLine) && /[;{}=>]/.test(firstLine)) return 'Pasted code';

  t = firstLine
    .replace(/\[image:[^\]]*\]/gi, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/`+|\*\*|__/g, '').replace(/^[>#\s]+/, '')               // markdown noise, but keep #123 mid-sentence
    .split(/\s+/).map(w => (w.includes('/') && (w.split('/').length > 2 || /\.\w{1,5}\W*$/.test(w)))
      ? w.replace(/^[@'"(]+/, '').replace(/\/+$/, '').split('/').pop() : w).join(' ')   // paths -> file name; "and/or" stays
    .replace(/\s+/g, ' ').trim();
  t = t.replace(LABEL, '');
  for (let i = 0; i < 3; i++) t = t.replace(FILLER, '');                   // "ok so can you ..." -> "..."
  t = (t.split(/(?<=[.!?])\s+|\s+[-–—]\s+/)[0] || '').replace(/[.:;,\s]+$/, '').trim();   // first sentence/clause
  if (t.length < 3 || NO_TOPIC.test(t) || (t.split(' ').length <= 2 && /\b(?:this|that|it|them)\W*$/i.test(t))) return null; // nothing to name

  t = t[0].toUpperCase() + t.slice(1);
  if (t.length > max) {
    const next = t.indexOf(' ', max - 1);                    // finish a word that straddles the limit, if it's not far off
    const end = next === -1 || next > max + 14 ? 0 : next;
    const cut = t.slice(0, max - 1), sp = cut.lastIndexOf(' ');
    t = (end ? t.slice(0, end) : sp >= 20 ? cut.slice(0, sp) : cut).replace(/[\s,.;:(\-–—]+$/, '') + '…';
  }
  return t;
}
