# nodegui-game

NodeGui + TypeScript によるローカル2Dパズルゲームのプロトタイプ環境。

## Commands

- パッケージマネージャ: yarn（Yarn 4 / Berry）。`.yarnrc.yml` で `nodeLinker: node-modules` を指定 — `@nodegui/nodegui` はネイティブアドオンのため PnP では壊れる
- `npm start` / `yarn start`: 同梱の `qode` バイナリ + `ts-node/register/transpile-only` で起動する。素の `node` では Qt バックエンドのネイティブアドオンをロードできず、Qtのイベントループも回せない
- `yarn typecheck`: 型チェックのみ（`tsc --noEmit`）
- `yarn build`: `dist/` へコンパイル
- フォーマッタ・リンタ・テストランナー: 未整備（ever-better のブートストラップで追加予定）

## 構成

- `src/logic/`: 純粋なゲームルール（Board / Rules / Game状態）。NodeGuiに依存しない — 画面なしでユニットテスト可能にするため分離
- `src/ui/`: NodeGuiのウィジェット・描画

## ハマりどころ

- `FlexLayout`（Yogaベース）の子ウィジェットは、`setInlineStyle` で明示的なpx単位の `width`/`height` を指定しないとサイズ0として扱われ、描画されない。`height: 100%` のようなパーセント指定も親の行の高さに対して正しく解決されなかった — 固定pxを使うこと
- `QWidget#layout` はメソッドであり、プロパティではない。`widget.layout?.addWidget(...)` は静かに失敗する（`.layout` は関数そのものを指す）— レイアウトインスタンスは直接変数で保持すること
- テキストを表示するウィジェットは `setStyleSheet` で `color` を明示しないと、環境のデフォルトテーマ次第で背景と同化して見えなくなる
- この環境にはデフォルトでCJKフォントが入っていない。日本語UIテキストには `fonts-noto-cjk` 等のインストールが必要

## 生成ファイル（手編集禁止）

- `.ever-better/state.json`, `eslint-suppressions.json`, `QUALITY.md` — `ever-better` CLI が書き込む
