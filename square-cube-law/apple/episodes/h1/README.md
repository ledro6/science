# h1 · Шестой этаж

Оригинальная вымышленная история и пилот рубрики «Мистические истории». Сценарий в `script.py`, покадровый план в `STORYBOARD.md`. Постановка и модели находятся в `scenes/film.mjs` и `scenes/props.mjs`. Обложка использует ту же модель лифта из `hero.mjs`.

Озвучка сделана голосом ru-RU-DmitryNeural в темпе −4%. В `build/voice/` сохранены оригинальные MP3 и словесные тайминги. Стандартный `tiktok/tts.py` собирает из них WAV и таймлайн.

Для звука h1 использует `mix.py`. Он сохраняет обработку голоса и эффектов L³, а вместо обычной музыки добавляет оригинальный фон на основе гула лифта. Из папки `apple/`:

```bash
python3 ../tiktok/tts.py episodes/h1
EP=h1 node capture.js sfx
python3 episodes/h1/mix.py --build episodes/h1/build --duck -19
python3 ../tiktok/srt.py episodes/h1
EP=h1 SCALE=1.3333333 node capture.js 60 0 6590 episodes/h1/build/part0.mp4
ffmpeg -i episodes/h1/build/part0.mp4 -i episodes/h1/build/mix.wav \
  -i episodes/h1/build/subs.srt -map 0:v -map 1:a -map 2:s -c:v copy \
  -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=rus \
  -movflags +faststart -t 109.821 episodes/h1/l3_h1.mp4
```

При изменении текста или темпа заново проверь таймлайн. Количество кадров равно округлённой вверх длительности из `timeline.json`, умноженной на 60.
