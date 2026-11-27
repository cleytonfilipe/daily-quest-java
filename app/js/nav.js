// Navegação simples entre abas/telas.
export const route = { tab: 'hoje', params: {} };
let renderFn = () => {};
export const setRenderer = (f) => { renderFn = f; };

export function go(tab, params = {}) {
  route.tab = tab;
  route.params = params;
  renderFn(true);
}
export const rerender = () => renderFn(false);
