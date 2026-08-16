# Quality

Maintained by [ever-better](https://github.com/isamu/ever-better). Numbers are rendered from
`.ever-better/state.json`; edits outside the notes block are overwritten on the next run.

- Phase: **drain**
- Frozen: 2026-08-16T06:38:16.675Z
- Open violations: **2**
- Rules improved since the ceiling: **0**
- Everything is at or below its ceiling.

## Worklist

Top to bottom. An unattended run works this list and nothing else.

- [x] **P0 diagnose** — taken 2026-08-16T06:32:28.525Z
- [x] **P1 bootstrap** — nothing missing
- [x] **P2 freeze** — frozen 2026-08-16T06:38:16.675Z
- [ ] **P3 drain** — 2 violations across 1 rules
  - [ ] `sonarjs/function-return-type` — 2 left
- [ ] **P4 tighten** — add the next rule tier, then freeze and drain again
- [ ] **P5 duplication and dead code** — report-only scans; extraction is judgment, not a threshold

## Ratchet

Ceiling is the count at the last freeze. It may fall and must never rise.

| Rule | Ceiling | Now | Change | Status |
| --- | ---: | ---: | ---: | --- |
| `sonarjs/function-return-type` | 2 | 2 | 0 | draining |

## Other counters

| Counter | Ceiling | Now |
| --- | ---: | ---: |
| eslint:warnings | 1 | 1 |

## Outstanding

Nothing outstanding.

## Work log

| Date | Commit | Kind | Rule | What |
| --- | --- | --- | --- | --- |
| 2026-08-16 | 9dd41208 | drained | knip | knip の未使用検出3件を対処: isGameOver はどこからも呼ばれない完全なデッドコードだったため削除、getFlippableStones は同一ファイル内でのみ使われていたため export を外し、ts-node は package.json の start スクリプトから -r フラグ経由で使われている（静的解析では見えない）誤検知のため knip.json の ignoreDependencies に追加。挙動に変更なし |
| 2026-08-16 | 2c316858 | drained | @typescript-eslint/restrict-template-expressions | 13 violations, all in src/ui/OthelloWindow.ts; wrapped every numeric template-literal interpolation (pixel sizes, board row/col, stone counts) in String(...) -- output strings are identical to what the implicit coercion already produced, so no behavior change |
| 2026-08-16 | 7b67dadb | drained | @typescript-eslint/no-confusing-void-expression | 5 violations; eslint --fix wrapped 5 arrow-shorthand callbacks (Board.forEachCell, applyMove's flip loop, two button click handlers) in braces so the void return isn't implicit -- no behavior change |
| 2026-08-16 | 94c2756d | drained | id-length | 3 violations; renamed board.ts's forEach index params (r/c -> rowIndex/colIndex) and OthelloWindow's map callback param (p -> move) -- no behavior change |
| 2026-08-16 | ff86735a | issue | sonarjs/function-return-type | opened #4 -- flags idiomatic discriminated-union returns (MoveOutcome) in src/logic/game.ts; rule-vs-code call for the owner |
| 2026-08-16 | ecf2d3b8 | drained | @typescript-eslint/consistent-type-assertions | 2 violations; the double 'as unknown as {win}' cast on global was asserting a property that doesn't exist on globalThis's type. Replaced with a proper 'declare global { var win }' ambient augmentation -- same runtime behavior (NodeGui widgets hold only a weak ref from native to JS, so the entry point must keep a strong JS reference alive), no more lying to the compiler |
| 2026-08-16 | 76458303 | drained | sonarjs/argument-type | 1 violation; false-flag on Array<CellState>(n).fill(null) via the generic-constructor-call form — rewrote as nested Array.from with an explicit CellState return type, same behavior |
| 2026-08-16 | 9eaa9910 | note |  | typescript stayed on 5.9.3 (latest is 7.0.2): typescript-eslint@8.67.0 peer range is >=4.8.4 <6.1.0, and Yarn 4.12's compat/typescript patch also fails to fetch against 7.0.2 in this environment. eslint/@eslint/js/prettier/vitest/knip/typescript-eslint are all already at latest. |

## Notes

<!-- ever-better:notes:start -->
_Anything written between these markers survives a re-render._
<!-- ever-better:notes:end -->
