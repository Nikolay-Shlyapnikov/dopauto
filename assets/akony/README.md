# Крупные слова AKONY

Шрифт AKONY в секцию Яндекс KIT не подключить, поэтому слова — SVG в кривых.

| Файл | Источник | Размер |
|---|---|---|
| `kachestvo.svg` | Figma, «Качество - анимация» → Показан, Copy as SVG | 1049×68 |
| `detali.svg` | Figma, «Детали - анимация» | 804×75 |
| `material.svg` | Figma, «Материал - анимация» | 1092×67 |
| `sotrudnichestvo.svg` | Figma, «Сотрудничество - анимация»; viewBox расширен до полного слова (в Figma рамка компонента обрезала «…ВО») | 1879×76 |
| `otzyvy.svg` | Figma, «Отзывы - анимация» | 867×69 |
| `dopavto.svg` | Figma, «Katalog vse — прокрутка», стиль «Фоновый текст/допавто» 145 px; чёрный, opacity 0.1; viewBox расширен до полного слова (в Figma края срезала рамка 1440) | 1473.5×115 |
| `kachestvo-mobile.svg` | собрано из `kachestvo.svg`: КАЧЕС / ТВО | 642×172.5 |
| `material-mobile.svg` | собрано из `material.svg`: МАТЕРИ / АЛ | 803×171.5 |

Обрезку краем экрана делаем в вёрстке (`overflow: hidden` у секции), а не в файлах — так слова корректно уходят за край на любой ширине.

Цвет слов — `#E2E2E2` (ДОПАВТО — чёрный 10%). Размер на ПК — 95 px кегля, на телефоне — 50 px; ДЕТАЛИ и ОТЗЫВЫ на телефоне — те же файлы, уменьшенные в CSS.

Пересборка мобильных вариантов (шаг строки 104.5 = межстрочный 55 px × 95/50):

```bash
node tools/split-word.mjs assets/akony/kachestvo.svg assets/akony/kachestvo-mobile.svg 5 104.5
node tools/split-word.mjs assets/akony/material.svg assets/akony/material-mobile.svg 6 104.5
```
