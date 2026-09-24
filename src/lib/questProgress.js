// Quest objective helpers. Objectives may be legacy strings or
// { text, done } objects; this normalizes them and computes completion.

export function normalizeObjectives(objectives) {
  if (!Array.isArray(objectives)) return [];
  return objectives.map((o) => {
    if (typeof o === 'string') return { text: o, done: false };
    if (o && typeof o === 'object') return { text: o.text || '', done: !!o.done };
    return { text: String(o), done: false };
  });
}

export function questProgress(quest) {
  const objs = normalizeObjectives(quest?.objectives);
  if (objs.length === 0) return { total: 0, done: 0, percent: 0 };
  const done = objs.filter((o) => o.done).length;
  return { total: objs.length, done, percent: Math.round((done / objs.length) * 100) };
}