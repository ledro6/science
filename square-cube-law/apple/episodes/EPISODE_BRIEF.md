# Бриф выпуска канала L³

Ты делаешь сцены одного выпуска вертикального научпоп-ролика канала **L³** (слоган «Мир в кубе»).
Стиль — презентации Apple: монохром, продуктовая 3D-подача, огромные цифры, тихое уверенное движение.

## Прочитай перед работой
1. `/home/user/science/CLAUDE.md` — правила канала (акцент, текст, разрешение). Они обязательны.
2. `/home/user/science/square-cube-law/apple/BRIEF.md` — API движка, безопасные зоны, бюджет скорости, проверка.
3. `/home/user/science/square-cube-law/tiktok/APPLE_STYLE.md` — визуальный язык Apple.
4. `engine.mjs` и `models.mjs` в `square-cube-law/apple/` — целиком.
5. Эталон качества — сцены пилота `square-cube-law/apple/scenes/*.mjs` (особенно `hook.mjs`, `cube.mjs`, `strength.mjs`). Твой выпуск должен быть не хуже.

## Твоя папка: `square-cube-law/apple/episodes/<ep>/`
- `script.py` — сценарий (не меняй текст; если видишь фактическую ошибку — напиши в отчёте).
- `build/timeline_readable.txt` — тайминг каждого слова (`слово@секунда`), `build/timeline.json` — полные данные.
- `scenes.json` — список id сцен. Для каждого id создай `scenes/<id>.mjs`:
```js
import { defineScene, makeStage, orbit, project, atext, atextWords, acount, accent, P, Wd, THREE, MAT /* … */ } from '../../../engine.mjs';
import { makeAnt, makeElephant, makeMouse, makeFlea, makeBone, rod } from '../../../models.mjs';
defineScene('<id>', { setup(s) { … return { stage, … }; }, update(t, s, st) { … }, draw2d(t, s, st) { … }, sfx(add, s) { … } });
```
- Обложки: `cover.json` и `hero.mjs` (см. ниже).
- Меняй ТОЛЬКО файлы в своей папке. Движок, модели, брендовый генератор и чужие выпуски не трогай (параллельно работают другие агенты).

## Обязательные правила
- **Фон сцены:** `makeStage({ bg: 'black' | 'white' })`, чередуй сцены (хук и финал — чёрные).
- **Акцент:** красный (`accent()` в draw2d или `st.stage.accent`) — только для ГЛАВНОЙ величины выпуска (её «L³-смысла»: то, что растёт сильнее всего / ломает интуицию) и автоматически для «³». Один красный элемент на кадр. Остальное монохром.
- **Текст в кадре:** без точек в конце, без длинных тире (—). Дефис в составных словах можно. ≤ 7 слов в заголовке.
- **Синхронизация:** всё по `Wd(key, 'слово')` / `WdE` — каждое появление привязано к слову диктора. Смена визуала каждые 1–2 с.
- **Чистая функция времени:** update/draw2d выставляют всё из t, без накопленного состояния; случайность только `rng(seed)`.
- **Скорость:** кадр ≤ 450 мс при s=1 (без env-карт, transmission, постобработки; повторы — InstancedMesh).
- **Финал (сцена outro):** чёрный фон, итоговая мысль из o1 крупно, на o2 — финальная карточка: название закона (atextWords, белым), строка формулы/цифры серым, и красная пилюля «Подписаться на L³» как в пилоте (`apple/scenes/outro.mjs`, строки с пилюлей — повтори её поведение).
- **Звук `sfx`:** мягко, по-эппловски (whoosh/thump на появление объекта, click на сборку, chime на цифру, riser за 1,5 с до главного акцента, impact на нём).

## Обложки
`cover.json`:
```json
{ "n": 2, "law": "Закон Клайбера", "hook": ["Почему мышь и слон", "живут одинаково"], "number": "1 000 000 000", "numberLabel": "ударов сердца за жизнь" }
```
(hook — вопрос/хук в две короткие строки без точек; number — главная цифра выпуска, будет красной на обложке Shorts; law — название закона без точки.)

`hero.mjs` — 3D-герой обложки:
```js
export default function (THREE, { MAT, roundedBox, glassEdges, shadowsOn, models }) {
  const object = new THREE.Group(); /* … модель … */ shadowsOn(object);
  return { object, cam: { az: 35, el: 15, dist: 6, target: [0, .5, 0], fov: 24 } };   // floor: false — без пола
}
```
Проверка обложек: `cd /home/user/science/square-cube-law/brand && node capture.js ep<N>-tiktok-cover,ep<N>-shorts-cover` → `brand/out/ep<N>-*.png` (2160×3840). Герой должен быть крупным, в нижних двух третях, не налезать на текст.

## Проверка сцен
`cd /home/user/science/square-cube-law/apple && EP=<ep> node capture.js stills 1.2,2.5,4.0 <префикс> only=<id>` → `episodes/<ep>/stills/`.
Смотри кадры каждые ~0,7 с (контакт-листы через Pillow), исправляй до чистого результата. Ошибок `PAGE ERROR`/`CONSOLE`/`RENDER ERROR` быть не должно.
Видео не рендерь. В конце — краткий отчёт: что сделано, 4–5 лучших кадров (пути), спорные места.
