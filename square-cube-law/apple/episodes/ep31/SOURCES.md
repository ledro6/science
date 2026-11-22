# Проверка фактов ep31

Сценарная основа: переданное координатором задание, Google Sheets «План v2», №27, космонавт моложе брата-близнеца. Новый текст, основная серия ep31.

Первичные академические разъяснения получены через Firecrawl 2026-11-21:

1. Markus Pössel, [The case of the travelling twins](https://www.einstein-online.info/en/spotlight/twins/), Einstein Online, том 04 (2010), 01-1007. Портал Max Planck Institute for Gravitational Physics (Albert Einstein Institute). Обосновывает разницу возраста и несимметричность целого путешествия: космонавт не остаётся одним инерциальным наблюдателем.
2. Markus Pössel, [Twins on the road](https://www.einstein-online.info/en/spotlight/twinsroad/), Einstein Online, том 04 (2010), 01-1008. Прямо объясняет: разница не сосредоточена в фазе ускорения, она получается суммой собственного времени равномерных участков. Разворот соединяет два участка.

Поиск Firecrawl id: 01a1fd7d-db59-71cf-917d-e8cf764676a3, полезный результат web 1; feedback отправлен. Scrape второго источника id: 01a1fd7e-1337-7227-92e2-ca82d2e101f2.

Точный расчёт: `/workspace/artifacts/l3-batch/ep31/calculate.py`, результат `calculation.json`. β=4/5, √(1−β²)=3/5, γ=5/3, Δτ=10/(5/3)=6 лет. Каждое плечо: 5 лет на Земле, 3 года на корабле. Это идеализированная модель с пренебрежимо коротким разворотом и без гравитации, не практический маршрут космической миссии.
