// Gera os ícones PNG do app a partir do sprite do herói.
// Uso: node tools/gen-icons.cjs   (requer Playwright + Chromium)
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const { heroSVG } = await import(path.join(__dirname, '..', 'app', 'js', 'sprites.js'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [180, 192, 512]) {
    const sprite = heroSVG({ skin: '#e8b48a', hair: '#6b3e1f', outfit: '#3b5dc9' }, 'guerreiro', Math.round(size * 0.72));
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0">
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
        background:linear-gradient(#1a1c2c 0 68%, #2a5a3a 68% 100%);">${sprite}</div></body></html>`);
    await page.screenshot({ path: path.join(__dirname, '..', 'app', 'icons', `icon-${size}.png`), clip: { x: 0, y: 0, width: size, height: size } });
    console.log(`icon-${size}.png`);
  }
  await browser.close();
})();
