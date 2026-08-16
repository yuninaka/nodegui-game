# nodegui-game

NodeGui + TypeScript によるローカル2Dパズルゲームのプロトタイプ環境。

## Commands

- パッケージマネージャ: yarn（Yarn 4 / Berry）。`.yarnrc.yml` で `nodeLinker: node-modules` を指定 — `@nodegui/nodegui` はネイティブアドオンのため PnP では壊れる
- `npm start` / `yarn start`: 同梱の `qode` バイナリ + `ts-node/register/transpile-only` で起動する。素の `node` では Qt バックエンドのネイティブアドオンをロードできず、Qtのイベントループも回せない
- `yarn typecheck`: 型チェックのみ（`tsc --noEmit`）
- `yarn build`: `dist/` へコンパイル（`tsconfig.build.json`、`src/` のみ）
- `yarn lint` / `yarn format` / `yarn test`（vitest, `test/` 配下）/ `yarn knip`（dead code検出）

新しいヘルパー関数を書く前に `docs/shared-helpers.md`（`ever-better catalog` が生成）を確認すること。既存の実装の再発明を防ぐためのカタログ。

## 構成

- `src/logic/`: 純粋なゲームルール（Board / Rules / Game状態）。NodeGuiに依存しない — 画面なしでユニットテスト可能にするため分離
- `src/ui/`: NodeGuiのウィジェット・描画
- `src/audio/`: 効果音再生。システムの音声プレイヤー（paplay/aplay/ffplay/afplay/PowerShell）を子プロセスとして起動する方式 — NodeGuiにQtMultimedia相当のAPIは無い

## ハマりどころ

- `FlexLayout`（Yogaベース）の子ウィジェットは、`setInlineStyle` で明示的なpx単位の `width`/`height` を指定しないとサイズ0として扱われ、描画されない。`height: 100%` のようなパーセント指定も親の行の高さに対して正しく解決されなかった — 固定pxを使うこと
- `QWidget#layout` はメソッドであり、プロパティではない。`widget.layout?.addWidget(...)` は静かに失敗する（`.layout` は関数そのものを指す）— レイアウトインスタンスは直接変数で保持すること
- テキストを表示するウィジェットは `setStyleSheet` で `color` を明示しないと、環境のデフォルトテーマ次第で背景と同化して見えなくなる
- この環境にはデフォルトでCJKフォントが入っていない。日本語UIテキストには `fonts-noto-cjk` 等のインストールが必要
- 効果音を連続再生する際、クリックごとに別プロセスを起動する方式は避けること。WSL2ではプロセス生成コストが高く、数十msの間隔で連続起動すると詰まって遅延が蓄積する。複数回分の音声を1つのWAVに合成し、1回のプロセス起動で再生する（`src/audio/wavBurst.ts`）
- **試して失敗した方式**: `paplay --raw`/`aplay -t raw` をアプリ起動中ずっと1プロセスだけ常駐させ、そのstdinにPCMデータを都度書き込む方式（手ごとの接続コストを無くす狙い）。プロセスは生き続け `pactl list sink-inputs` にもストリームは見えるが、実際にはPulseAudio側で溜め込まれるだけで音が鳴らず、アプリを閉じてパイプがEOFになった瞬間に溜まった分がまとめて再生される、という壊れ方をした（実機で確認）。`pactl` の出力だけでは「本当に音が出ているか」は判定できない — 人間の耳で確認するまで動作したと言わないこと
- 上記の代わりに、手ごとに1プロセスを起動するファイル方式（`playArgs`）のまま、`paplay` に `--latency-msec=20` を渡してバッファリングを減らす方向で遅延を緩和している（`src/audio/playClickSound.ts`）
- `eslint-plugin-security` の `detect-non-literal-fs-filename` は `path.join(__dirname, "リテラル文字列")` のような静的に解決できるパスは許容するが、`os.tmpdir()` や `crypto.randomUUID()` を含むパスは（安全であっても）警告する。一時ファイルは `__dirname` 起点の固定パスに書くこと

## 生成ファイル（手編集禁止）

- `.ever-better/state.json`, `eslint-suppressions.json`, `QUALITY.md`, `docs/shared-helpers.md` — `ever-better` CLI が書き込む
