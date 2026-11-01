# Аудит качества репозитория `chessr-unlocked`

Дата: 2026-11-01 · Проверяемая ревизия: `main` @ `8d3b570` + незакоммиченное рабочее дерево
Статус: **исторический снимок**. Большая часть находок закрыта в ветке
`chore/repo-quality-pass` — см. историю коммитов после `8d3b570`. Документ сохранён
как есть, чтобы было видно исходное состояние и обоснование правок. Пути вида
`versions/<v>/chessr-unlocked-all-features/` в этом документе описывают состояние «до»:
позже сборка переехала в патч-слой (`versions/<v>/patches/`).
Метод: статический анализ локального клона, git-инспекция, исполнение собственного
чек-листа репозитория, сверка документации с кодом, запросы к GitHub API.

---

## 1. Вердикт

**Оценка: 5.4 / 10.** Это репозиторий с *выдающейся документацией и слабой
инженерной обвязкой*.

Документационная архитектура (README → `docs/` → `knowledge-base/` → per-version
`PROJECT_REPORT.md`, с явными инвариантами и «единственным источником правды») —
уровня хорошей внутренней документации продукта, а не хакатона. Но вокруг неё
нет ничего, что заставляет эту документацию оставаться правдой: нет CI, нет
тестов, нет лицензии, нет скриптов, на которые ссылается сама документация, а
часть заявленных утверждений уже разошлась с кодом.

Три главных риска:

1. **Юридический** — репозиторий распространяет чужой проприетарный код и
   GPL-производный `Stockfish.js` вообще без лицензий и NOTICE (`LICENSE` нет).
2. **Этический/репутационный** — `rules.json` блокирует античит chess.com, и в
   README об этом не сказано ни слова.
3. **Инженерный** — рабочее дерево `main` грязное: 23 файла, **+4171 / −5261**,
   включая исправление реального бага и новую фичу, которые не закоммичены и
   живут в одном экземпляре на одной машине.

---

## 2. Что проверено

| Проверка | Результат |
|---|---|
| Собственный чек-лист репозитория (`docs/repository-layout.md` §Validation) | JS-парсинг 12/12 ✅, JSON 4/4 ✅, относительные ссылки 40/41 ✅ |
| Хэши авто-генерируемых регионов (`knowledge-base/.regions.json`) | 9/9 MATCH ✅ |
| Валидность JSON в `knowledge-base/` | 5/5 ✅ |
| Якоря из `unlock-manifest.json` против baseline | 1 из 15 отсутствует, 6 неоднозначных ❌ |
| Кросс-сборок diff (original vs unlocked) | 16 файлов расходятся, в т.ч. не описанные в §10 ⚠️ |
| git-здоровье | 366 loose-объектов, 0 pack-файлов, 35 MB garbage ❌ |
| Секреты | только публичный Supabase anon JWT ✅ |
| Метаданные GitHub | description отстал на версию, license = null ⚠️ |

---

## 3. Сильные стороны

### 3.1. Документация как система, а не как файл

README — 152 строки и он **индексирует**, а не дублирует: каждая тема уходит в
свой слой. В `docs/README.md` есть таблица «какой вопрос куда класть» и два
жёстких правила (никакой документации внутри build-папок; никакой дублирующей
правды). Это редкость: обычно README разрастается до 800 строк и гниёт.

### 3.2. Инварианты, которые можно проверить

`docs/repository-layout.md` фиксирует: одна папка = одна semver-версия, ровно две
сборки на версию, `chessr-original-restored/` read-only, `engine/` не трогать,
build-папка содержит только то, что грузит Chrome. И там же — исполняемый
чек-лист. Я его прогнал: он **проходит** (12/12 JS, 4/4 JSON).

### 3.3. Машинно-проверяемое знание

- `unlock-manifest.json` — 9 разблокировок с `anchors`, `transform`, `verify`,
  `confidence`, `version_introduced` / `version_last_verified`. Это превращает
  реверс-инжиниринг из «я помню, что там что-то поменял» в воспроизводимый процесс.
- `signatures/<version>.json` — механически извлечённые отпечатки (20 KB каждый).
- `.regions.json` — хэши авто-генерируемых блоков; проверка дрейфа **работает**
  (9/9 совпали). Механизм реальный, а не декоративный.

### 3.4. Эпистемическая честность

`PROJECT_REPORT.md` §11 «Known gaps / things not verified» прямо перечисляет, чего
автор не знает (пороги классификации ходов, схема `chessr_stream_state`, политика
бэкенда для `userId=anon`). В `knowledge-base/authentication.md` — пометки
`⚠️ Unknown … Confidence: low`. Для реверс-инжиниринга это правильная культура:
не додумывать.

Оговорка: честность здесь направлена *наружу* (на поведение расширения и
бэкенда), но не *на себя*. Там, где отчёт описывает собственный результат
работы — сколько кода реально отрефакторено, какие якоря исправлены — он
завышает (см. P1-3, P1-4). Это типичная асимметрия: внешние пробелы
признаются, внутренние — нет.

### 3.5. Мелочи, которые обычно забывают

- `.gitattributes`: бинарные типы + `linguist-vendored` для движков, чтобы
  статистика языков отражала собственный код.
- `.gitignore`: `_metadata/` (кэш Chrome), `dist/`, `.chessr-re/`.
- Релизы существуют и закрывают потребность «не клонировать 130 MB»: два тега,
  по одному tarball на сборку, README ссылается на `releases/latest`, а не на
  конкретный тег.

---

## 4. Проблемы по приоритетам

### P0 — блокеры

#### P0-1. Нет лицензии; распространяется GPL-код и чужой проприетарный код

**Факт.** В репозитории нет `LICENSE`/`NOTICE` (GitHub API: `license: null`).
При этом:
- `engine/stockfish.js` содержит шапку `Stockfish.js 18 (c) 2026, Chess.com, LLC`
  и `Stockfish (c) T. Romstad, M. Costalba, J. Kiiski` — это GPL-производный
  бинарник, а текст GPL и предложение исходников отсутствуют;
- `engine/dragon.wasm` — коммерческий Komodo Dragon, закрытый;
- `engine/maia3/ort/*` содержит `Copyright (c) Microsoft Corporation` (MIT/ONNX
  Runtime) — уведомление тоже отсутствует;
- сам код Chessr.io — проприетарный, никаких прав на распространение не дано.

**Риск.** Это не «строгость лицензии», а прямой DMCA-триггер: репозиторий
публичный, GitHub-репорт по форме достаточно частый сценарий. Плюс отсутствие
лицензии юридически означает «все права защищены» — то есть репозиторий
нельзя ни форкнуть законно, ни переиспользовать.

**Что делать (минимум на день).**
1. `NOTICE.md`: перечислить все сторонние компоненты и их лицензии
   (Stockfish.js → GPLv3 + ссылка на исходники; ONNX Runtime → MIT; Komodo
   Dragon → «не распространяется, удалить или не публиковать»; Maia → проверить
   лицензию весов).
2. Явно написать в `README` раздел «License status»: код Chessr.io не
   лицензирован, права не передаются, репозиторий — архив исследования.
3. Решить судьбу `dragon.wasm` отдельно: если лицензия Komodo не позволяет
   редистрибуцию — бинарник не должен лежать в публичном репозитории.

#### P0-2. `rules.json` блокирует античит, и об этом не сказано в README

**Факт.** `versions/*/chessr-*/rules.json` содержит три правила `block`:

```json
"urlFilter": "|https://www.chess.com/service/fair-play/chesscom.fair_play.v2.FairPlayService/",
"urlFilter": "|.../play-monitor-browser-extensions.chunk.client.*.js",
"urlFilter": "|https://www.chess.com/service/user-activity/.../DispatchEventBatch"
```

Это обход **детекции расширений и fair-play** на живой платформе. В README
(152 строки) нет ни слова `rules.json`, `fair-play`, `anti-cheat`, `permission`
(проверено grep: 0 упоминаний). `docs/code-map.md` нейтрально называет это
«blocks specific chess.com telemetry / anti-cheat requests», но корневой README
читают все, а `code-map` — почти никто.

**Риск.** Именно этот файл — главный аргумент для бана аккаунтов, DMCA и
репутационного удара. Держать его неназванным = выглядеть как «research
project», будучи инструментом обхода античита. Расхождение между дисклеймером
(«research/educational purposes») и фактическим поведением кода — худший тип
несоответствия.

**Что делать.** Либо раскрыть честно (отдельный раздел README «What it modifies
on chess.com» + `docs/`), либо не публиковать этот файл в открытом репозитории.
Молчаливое «draws the line between privacy and functionality» здесь не работает.

#### P0-3. Репозиторий весит 1.2 GB, из них 768 MB — четыре байт-идентичные копии

**Факт.**

| Метрика | Значение |
|---|---|
| Рабочее дерево | 1.2 GB |
| `versions/` | 767 MB |
| Одна `engine/` | 184 MB |
| Копий одной `engine/` | **4** (2 версии × 2 сборки), md5 деревьев совпадают |
| `.git` | 442 MB, **366 loose-объектов, 0 pack, 35 MB garbage** |
| GitHub (сжато) | ~130 MB (API: `size: 133785`) |

`git gc` не запускался ни разу. `git count-objects -vH` показывает
`garbage: 1, size-garbage: 35.54 MiB` — брошенный `tmp_obj_*`.

**Риск.** Клон — минуты вместо секунд; каждый новый клон тянет 130 MB. Отдельная
мина: `rodent.data` = 68 MB, лимит GitHub на файл — 100 MB. Один апстрим-бинарник
чуть крупнее — и `git push` начнёт отбиваться уже после того, как история
записана.

**Что делать.**
```bash
git gc --prune=now --aggressive       # 442 MB loose → pack, минус 35 MB мусора
git count-objects -vH                 # проверить
```
Далее на выбор:
- оставить дублирование (оно осознанное — см. `docs/repository-layout.md` §4:
  сборка должна оставаться loadable), но добавить в CI проверку «ни один файл
  не > 90 MB»;
- или хранить `engine/` один раз + `engine.manifest.json` с SHA-256 и скрипт
  `scripts/hydrate-engines.sh`. Цена — «клон → распаковал → загрузил» перестаёт
  работать в один шаг, поэтому я бы оставил дубли и просто задокументировал вес.

#### P0-4. `main` грязный: исправление бага и фича не закоммичены

**Факт.** `git status`: 23 изменённых файла, `+4171 / −5261`. Внутри:
- `stream.html`: `type="module"` → `defer` — **настоящий баг-фикс**. В
  комментарии прямо написано: ESM-строгий режим кидал `ReferenceError` на
  присваивании необъявленной переменной, «it crashed React's scheduler on load
  and left this page blank». То есть **опубликованный `main` содержит Stream
  Mode, который открывается пустым**, а фикс существует только локально;
- `content.js` (+4294 строки): новая фича (`widgetGroups`, миграция конфигов) и
  большой объём добавленных пояснительных комментариев;
- `cls-*.svg`: 11 иконок меняют цвет `#81B64C` (зелёный) → `#3b83d9` (синий);
- `PROJECT_REPORT.md`: −1044 строки (см. P1-4).

**Риск.** Самое дорогое, что есть в этом репозитории — этот незакоммиченный
диф. `git checkout .`, смена машины, случайный `git stash pop` — и он уходит.
Плюс любой, кто клонирует репозиторий сегодня, получает сломанный Stream Mode.

**Что делать сейчас.**
```bash
git switch -c fix/stream-mode-esm-and-widget-groups
git add -A
git commit -m "Fix Stream Mode blank page: load bundle as deferred classic script

The bundle has no ESM syntax but does assign undeclared globals (deobfuscation
artifact). Under type=module's strict mode this throws ReferenceError and React's
scheduler dies, leaving stream.html blank. defer preserves run-after-parse."
```
Затем — отдельными коммитами: иконки, комментарии, отчёт.

### P1 — важно

#### P1-1. Нет никакой инженерной обвязки

Отсутствуют: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`,
`CHANGELOG.md`, `.editorconfig`, `.github/` (ни issue-шаблонов, ни Actions, ни
dependabot), `package.json`, тесты, любой скрипт.

Отдельно больно: `knowledge-base/networking.md:2` утверждает, что эндпоинты
«extracted mechanically by `structural_signature.py` (never authored)», а
`learning-log/3.4.0.md:25` ссылается на `apply_unlocks.py` и `pipelines/audit.md`.
**Ни одного `.py` файла в репозитории нет** (проверено `find`). То есть
документация описывает инструменты, которых в поставке нет → заявленная
воспроизводимость не воспроизводима.

**Что делать.** `scripts/` с тремя утилитами (`signature.py`, `check_regions.py`,
`check_anchors.py`) + GitHub Actions, который гоняет ровно тот чек-лист, что уже
написан словами. Это ~80 строк YAML и превращает инварианты из прозы в запрет
на мерж.

#### P1-2. Обе сборки неразличимы в браузере

**Факт.** У `chessr-original-restored` и `chessr-unlocked-all-features` одинаковые
`"name": "Chessr.io — Chess assist done right!"` и `"version": "3.4.0"`. Нет
`key`, нет `update_url`, нет `short_name`, нет `minimum_chrome_version`.

**Следствия.** В `chrome://extensions` две плитки с идентичным названием и
версией — какая из них «unlocked», не видно. Версия не отражает факт модификации
(а апдейт-семантика сломана: 3.4.0-unlocked ≠ 3.4.0 upstream). `world: "MAIN"`
в `content_scripts` требует Chrome 111+, а `minimum_chrome_version` не задан —
на старом Chrome расширение молча не заработает.

**Что делать.**
```json
"name": "Chessr.io Unlocked",
"short_name": "Chessr Unlocked",
"version": "3.4.0.1",
"minimum_chrome_version": "111"
```

#### P1-3. Якоря в `unlock-manifest.json` частично сломаны

**Факт.** Проверил все 15 якорей против `3.4.0/chessr-original-restored`:

| Якорь | Вхождений в baseline | Проблема |
|---|---|---|
| `setNeedsLinking(true` | **0** | отсутствует вовсе → разблокировка `link-account-effect-noop` не найдётся |
| `user: null` | 96 | не локатор |
| `session: null` | 84 | не локатор |
| `plan: "free"` | 10 | неоднозначно |
| `inGuild: null,` | 4 | неоднозначно |
| `guidelinesAcceptedAt: null` | 4 | неоднозначно |
| `< 2500 && !` | 4 | неоднозначно |

При этом `learning-log/3.4.0.md:24` заявляет: «anchors were seeded with post-unlock
strings for 5 of 7 original entries — **corrected** to pre-unlock anchors this run».
Один якорь остался неисправен → заявление о верификации не соответствует факту.

**Что делать.** Формат якоря → `{file, text, expected_count}`, проверка в CI,
`expected_count` обязателен. Для `link-account-effect-noop` (у него
`detect: "absence"`) якорь должен быть взят из *соседнего* уникального узла
(например, `platform`-детект перед `setNeedsLinking`), а не из удаляемой строки.

#### P1-4. Документация уже разошлась с кодом

Четыре конкретных расхождения:

1. **`PROJECT_REPORT.md` §9** (это документ, объявленный «authoritative»)
   утверждает: `background.js`, `pageContext.js`, `chesscomAnon.js`,
   `chesscomFakeTitle.js` — «**Fully hand-refactored** (every identifier renamed,
   logic reorganized, header comments added in a prior version's pass) … safe to
   treat as authoritative, readable source». Проверка:

   | Файл | Строк | Различных `_0x`-идентификаторов | Комментариев |
   |---|---:|---:|---:|
   | `background.js` | 506 | 120 | **0** |
   | `pageContext.js` | 1976 | 371 | **0** |
   | `chesscomAnon.js` | 109 | 27 | **0** |
   | `chesscomFakeTitle.js` | 263 | 61 | **0** |

   Ни один из них не «every identifier renamed» и ни в одном нет «header
   comments». Это prettified-вывод, а не ручной рефакторинг. Ошибка не
   косметическая: на этом утверждении строится доверие к отчёту как к
   источнику правды.
2. **README:3** — «Deobfuscated, restructured copies». Реальность: `content.js`
   содержит **80 305** идентификаторов `_0x…`, stream-бандл — 66 113. Ниже по
   тексту отчёт честно оговаривает, что два больших бандла —
   «deobfuscated and reformatted, but not hand-renamed», но корневой README и
   `versions/3.4.0/README.md:3` («fully deobfuscated») этой оговорки не делают.
3. **docs/code-map.md:5-6** — «Differences between the two are behavioral only …
   **never structural**». Реальность: `diff -rq` даёт 16 расхождений, в том числе
   11 иконок (смена цвета), `content.css`, `stream-CEOOv34j.css` и
   `PROJECT_REPORT.md`. Косметика не описана ни в §10, ни где-либо ещё.
4. **Четыре копии PROJECT_REPORT.md** вместо одной. Расхождение осознанное и
   задокументировано (`versions/3.4.0/README.md`: «identical through §9 and
   diverge at §10»), но цена растёт: в 3.4.0 копии расходятся на 496 строк, в
   3.3.2 — на 246. И расходятся они уже не только на §10: в 3.4.0 отличаются
   формулировки §9.1 (строки 361 и 369) — то есть «общая» часть начала
   дрейфовать. При этом `docs/README.md` декларирует: «No duplicated knowledge.
   Each fact has exactly one canonical home».

Плюс свежий, самый неприятный случай: **незакоммиченный** `3.4.0/…/PROJECT_REPORT.md`
заменён на 16-строчный русскоязычный текст «Учебная цель», который прямо
противоречит README и самому репозиторию:

> «Не выполняются запросы к чужим аккаунтам, **не обходятся лицензии или
> подписки**, не подменяются ответы серверов».

Это ровно то, чем проект является. Если такой текст закоммитить, репозиторий
начнёт противоречить сам себе, а раз `PROJECT_REPORT.md` объявлен
«authoritative» — противоречие станет каноническим. Плюс нарушено правило
«пишем по-английски» из `docs/README.md`.

**Что делать.** Исправить §9 отчёта (реальное состояние: prettified + webcrack,
ручного переименования не было — и тогда перестать называть `background.js`
«authoritative, readable source»); правки README в три строки; §10 дополнить
разделом «cosmetic deltas»; рабочий отчёт вернуть к версии из `HEAD` (или
сознательно переписать — но без отрицания того, что делает код).

#### P1-5. `knowledge-base/` — скелет, а не база знаний

74 строки на 8 тематических документов (от 4 строк в `architecture.md` до 32 в
`authentication.md`; вся папка вместе с README и learning-log — 192), и **весь** текст
внутри `BEGIN AUTO-GENERATED / END AUTO-GENERATED` — то есть ни одного
человеческого абзаца вне автогенерации. README обещает «the repository's memory:
each processed version re-verifies the claims here, corrects what changed, and
appends what it learned». Фактически это оглавление с абзацем на раздел.

Это не катастрофа — как стартовая структура это хорошо. Проблема в позиционировании:
документ продаёт глубину, которой нет, и создаёт ложное чувство покрытия.

**Что делать.** Либо снизить обещания в `knowledge-base/README.md`, либо
дописать по 20–30 строк на раздел там, где знание реально есть (движки, движок
сообщений, хранилище — это всё уже понятно из кода). Разделы с пустотой
пометить `Status: stub`.

### P2 — гигиена

- **Смешанные переводы строк.** 141 файл LF, 4 файла CRLF (в `engine/`), 12
  бинарных. В `.gitattributes` нет `* text=auto eol=lf` → любой редактор может
  дать whole-file diff. Добавить:
  `* text=auto eol=lf` + `*.js text`, `*.md text`, `*.json text`.
- **`git diff --check`** ругается: `new blank line at EOF` в правимом отчёте.
- **Метаданные GitHub отстали**: description всё ещё «Chessr.io v3.3.2 — Complete
  authentication system removal…», topics пустые, license null, homepage нет.
- **Именование архивов расходится**: в релизах ассеты
  `chessr-unlocked-all-features-v3.4.0.tar.gz` (с `v`), а
  `docs/repository-layout.md` предписывает `chessr-unlocked-all-features-3.4.0.tar.gz`
  (без `v`). Glob в README совпадает, но документация и релизы разъехались.
- **Чек-лист даёт ложное срабатывание**: пункт 5 (`grep auth.signInWithPassword`)
  ловит вендоренный `supabase-js` внутри бандла, а не код приложения. Проверка,
  которая всегда «падает», перестаёт быть проверкой.
- **README не отвечает на вопросы, которые задают первыми**: «забанят ли меня?»,
  «какие разрешения и зачем?» (`debugger`, `declarativeNetRequest` — самые
  тяжёлые в MV3 и не упомянуты), «что уходит на сервер?» (`supabase.co`,
  `fingerprint.com`, `opens.chessr.io`, `m1.openfpcdn.io`), «почему explain-move
  не работает?», «какой Chrome нужен?». Раздел «Известные ограничения» есть, но
  он про одну фичу.
- **Нет визуала**: ни одного скриншота/гифки оверлея — для расширения с UI это
  главный недостающий элемент README.
- **Один открытый issue** (#1 «please do the new version», 2026-10-29) без ответа;
  при этом в репозитории уже лежит 3.4.0 — ответить одним комментарием дёшево.
- **Нет CHANGELOG** — «что нового в 3.4.0» есть только внутри §9.1 отчёта на
  1053 строки.

---

## 5. Оценки по категориям

| Категория | Балл | Комментарий |
|---|---:|---|
| Архитектура документации | 9.0 | Слои, инварианты, single-source-of-truth, чек-лист |
| README как витрина | 6.0 | Чисто, но нет скриншотов, разрешений, рисков, FAQ |
| Точность документации | 4.5 | 4 прямых расхождения с кодом + сломанный якорь |
| Полнота knowledge-base | 4.0 | 74 строки на 8 тем, всё в автогенерации |
| Воспроизводимость | 6.0 | manifest/signatures/regions реальны, но скриптов нет |
| Git-гигиена | 3.5 | 442 MB loose, 0 pack, 35 MB мусора, грязный `main` |
| Вес репозитория | 3.0 | 1.2 GB, 768 MB дублей движков |
| Инженерная обвязка (CI/тесты/линт) | 2.0 | Отсутствует полностью |
| Лицензирование | 1.0 | Нет LICENSE, GPL-код без GPL, проприетарные бинарники |
| Безопасность/прозрачность | 4.0 | Секретов нет, но `debugger` и обход античита не раскрыты |
| Поддержка/сообщество | 3.5 | 11 коммитов, 1 звезда, issue без ответа, description отстал |
| **Итого** | **5.4** | |

---

## 6. План улучшений

### Сегодня (1–2 часа, максимальный эффект)

1. Закоммитить незакоммиченное в ветку `fix/stream-mode-esm` (P0-4) — иначе
   единственная копия баг-фикса живёт на одной машине.
2. `git gc --prune=now --aggressive` (P0-3).
3. README: добавить раздел «Permissions & what it changes» (`debugger` → CDP
   синтетический ввод мыши, `declarativeNetRequest` → блокировка fair-play и
   детекции расширений, host permissions). Честно — 15 строк (P0-2).
4. README: заменить «Deobfuscated» на «webcrack + Prettier restored; identifiers
   remain bundler-generated in the two large bundles» (P1-4).
5. `NOTICE.md` со списком сторонних компонентов и их лицензий (P0-1).
6. Ответить на issue #1 и обновить GitHub description/topics.

### На этой неделе

7. `.github/workflows/verify.yml`, который запускает уже написанный чек-лист:
   `node --check` по всем не-engine `.js`; `JSON.parse` для manifest/rules;
   сверка `knowledge-base/.regions.json`; проверка относительных ссылок;
   `md5` равенства `engine/` между сборками; проверка якорей из
   `unlock-manifest.json`; проверка «нет файла > 90 MB».
8. `scripts/` — вынести этот чек-лист в `verify.py` + добавить недостающие
   `structural_signature.py` / `apply_unlocks.py`, на которые ссылается база знаний.
9. Починить формат якорей: `{file, text, expected_count}`; исправить
   `link-account-effect-noop`; переписать `user: null` / `session: null` на
   уникальные соседние строки.
10. Манифесты: разные `name`, `short_name`, `minimum_chrome_version: "111"`,
    bump версии до `3.4.0.1`.
11. `.gitattributes`: `* text=auto eol=lf`; убрать пустую строку в конце отчёта.
12. `LICENSE`/«License status» + решение по `dragon.wasm`.

### На месяц

13. Одна каноническая версия `PROJECT_REPORT.md`: разделить на
    `REPORT-ARCHITECTURE.md` (§1–§9, общий) и `REPORT-UNLOCK.md` (§10, только в
    unlocked-сборке) — либо генерировать две копии из одного источника и
    проверять в CI, что они совпадают до §10.
14. `CHANGELOG.md` + автосборка релизов (tarball по правилу из
    `repository-layout.md`) через Actions — ручные релизы уже разошлись по именам.
15. Дописать `knowledge-base/*.md` до заявленного объёма; пометить заглушки.
16. Скриншоты/демо в README, раздел FAQ (бан-риск, explain-move, Chrome-версия,
    размер клона).
17. `SECURITY.md`: что уходит наружу (Supabase, FingerprintJS, `opens.chessr.io`),
    какие данные локальны, как сообщить о проблеме.
18. Решить вопрос веса: оставить 4 копии `engine/` (осознанный компромисс,
    задокументирован) или перейти на манифест SHA-256 + `scripts/hydrate-engines.sh`.

---

## 7. Как проверить выводы самому

```bash
# размер и мусор
du -sh . .git versions; git count-objects -vH

# четыре одинаковые engine/
for a in versions/*/chessr-*; do echo "$a $(find $a/engine -type f | sort | xargs md5 -q | md5 -q)"; done

# незакоммиченная работа
git status --short; git diff --stat

# обфускация осталась
grep -o '_0x[0-9a-f]\+' versions/3.4.0/chessr-unlocked-all-features/content-scripts/content.js | wc -l

# обход античита
cat versions/3.4.0/chessr-unlocked-all-features/rules.json

# лицензии
grep -ril "GNU General Public\|MIT License\|Apache License" --include='*.md' --include='*.txt' .
head -3 versions/3.4.0/chessr-unlocked-all-features/engine/stockfish.js

# якоря
grep -rF "setNeedsLinking(true" versions/3.4.0/chessr-original-restored --include='*.js'   # 0 совпадений

# собственный чек-лист
node --check $(find versions/3.4.0 -name '*.js' -not -path '*/engine/*' | head -1)
```

---

*Документ закоммичен в `docs/` и добавлен в индекс `docs/README.md`. Держать его как
живой документ не нужно: это снимок «до», а актуальные инварианты проверяет
`scripts/verify.py`.*
