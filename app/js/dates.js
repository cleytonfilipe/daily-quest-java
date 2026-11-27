// Utilitários de data. Todas as chaves de dia usam o formato local "AAAA-MM-DD".
export const pad = (n) => String(n).padStart(2, '0');

export function keyOf(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const todayKey = () => keyOf(new Date());

export function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k, n) {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}
export const weekday = (k) => parseKey(k).getDay();

// Semana começa na segunda-feira; a chave é a data dessa segunda.
export function weekKey(k) {
  const d = parseKey(k);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return keyOf(d);
}
export const monthKey = (k) => k.slice(0, 7);
export const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function fmtDate(k) {
  const d = parseKey(k);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
export function fmtLong(k) {
  const d = parseKey(k);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
}
export function monthLabel(mk) {
  const [y, m] = mk.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
export function shiftMonth(mk, n) {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
