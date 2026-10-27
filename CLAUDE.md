# Канал L³ — законы природы

Научпоп-серия вертикальных роликов в стиле презентаций Apple. Канал называется **L³**.

- Видео (Apple-версия, эталон стиля): `square-cube-law/apple/` — движок Three.js + 2D, сцены в `scenes/`, сборка `render.sh`.
- Дизайн-код: `square-cube-law/design-code/` (и живая дизайн-система в Artifact).
- Логотип, баннеры, заставки: `square-cube-law/brand/` — `brand.mjs`, рендер `node capture.js`.

## Правило сдачи нового видео

Каждый новый ролик присылается пользователю ВМЕСТЕ с заставками для двух площадок:
1. **TikTok** — обложка 1080×1920 (`ep<N>-tiktok-cover.png`; подходит и для YouTube Shorts);
2. **YouTube** — превью 1280×720 (`ep<N>-youtube-thumbnail.png`).

Как: добавить запись выпуска в `EPISODES` в `square-cube-law/brand/brand.mjs`
(номер, закон, хук в две строки, главная цифра с подписью, 3D-герой), затем
`cd square-cube-law/brand && node capture.js ep<N>-tiktok-cover,ep<N>-youtube-thumbnail`,
проверить кадры и отправить вместе с mp4.
