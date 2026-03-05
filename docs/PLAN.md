# 実装計画：difff互換クライアント完結Diffツール（Next.js MVP）

## 1. ディレクトリ構成

```text
difff/
├── app/
│   ├── layout.tsx          # ルートレイアウト（テーマ変数、フォント）
│   ├── page.tsx            # メインページ（状態管理・オーケストレーション）
│   └── globals.css         # Tailwindベース + カラーテーマ変数
├── components/
│   ├── InputPanel.tsx      # テキスト入力エリア（クリア・Swapボタン含む）
│   ├── OptionsBar.tsx      # 英単語モード切替・テーマ切替
│   ├── DiffViewer.tsx      # 2カラム差分表示
│   ├── DiffRow.tsx         # 1行分のA/B差分セル
│   └── StatsRow.tsx        # 文字数・単語数・改行数統計行
├── lib/
│   ├── diff-engine.ts      # コアロジック（splitText・diff計算・DiffResult生成）
│   └── types.ts            # 共有型定義（DiffResult等）
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 2. 型定義（lib/types.ts）

要件 4.2.8 の中間データ形式をそのまま実装する。

```typescript
export type TokenType = "word" | "newline" | "entity" | "char"

export interface DiffToken {
  value: string
  type: TokenType
}

export type ChunkType = "equal" | "insert" | "delete" | "replace"

// diff-engine 内部の中間型（DiffResult には含まれない）
export interface DiffChunk {
  type: ChunkType
  tokensA: DiffToken[]
  tokensB: DiffToken[]
}

// 行配列モデル: diff-engine 側で生成し DiffResult に含める
// DiffViewer はこれを受け取るだけにする（UI側を薄く保つ）
//
// 1行は複数のチャンクタイプが混在しうるため、セル単位で type を持たず
// segments（type 付きトークン列の配列）で表現する
// 例: "foo bar baz" vs "foo qux baz" の1行内は
//     equal(foo ) + delete(bar) + equal( baz) が混在する
//
// replace チャンクを行分割した場合:
//   A 側セル → type: "delete"
//   B 側セル → type: "insert"
// （"replace" は diff-engine 内部の中間表現にとどめ、行モデルには出現しない）

export interface DiffSegment {
  tokens: DiffToken[]
  type: Exclude<ChunkType, "replace"> // "equal" | "insert" | "delete"
}

export interface DiffCellModel {
  segments: DiffSegment[]
}

export interface DiffRowModel {
  a: DiffCellModel
  b: DiffCellModel
}

export interface DiffStats {
  charCount: number // スペース・改行除く
  charWithSpace: number // 改行除く（spaceCount = charWithSpace - charCount で算出可）
  charWithNewline: number // （newlineCount = charWithNewline - charWithSpace で算出可）
  wordCount: number
}

export interface DiffResult {
  rows: DiffRowModel[] // 行ズレ補完済みの行配列（diff-engine が生成）
  statsA: DiffStats
  statsB: DiffStats
  truncated: boolean
}

export type WordMode = "compat" | "extended"
// compat:   [a-z]+ のみ（difff デフォルト）
// extended: [A-Za-z]+ （大文字対応）

export type Theme = "color1" | "color2" | "mono"
```

## 3. diff-engine.ts の実装方針

### 3.1 escapeChar（廃止）

~~splitText 前のエスケープ~~ **は行わない。**

- React の JSX 自然描画（`{text}`）が XSS を自動防止するためエスケープ不要
- 事前エスケープすると `&lt;` → `&amp;lt;` になり entity の正規表現（`&#?\w+;`）とずれる
- tokenize・diff は生テキストのまま行う
- `dangerouslySetInnerHTML` は使用しない

### 3.2 splitText

Perl の `split_text` 互換。優先度順の正規表現マッチで実装する。

```text
入力: 生テキスト
処理:
  1. CRLF/CR 正規化: text.replace(/\r\n?/g, '\n')
     ※ Windows 由来の \r が char 扱いになるのを防ぐ。stats の CR除去と一致させる
  2. \n を <$> に置換
  3. ループ: /^([a-z]+|<\$>|&#?\w+;|.)/s で先頭から1トークンずつ切り出し
出力: string[] （トークン配列）
```

- `WordMode = "extended"` の場合は正規表現を `/^([A-Za-z]+|<\$>|&#?\w+;|.)/s` に変更
- 各トークンに TokenType を付与（`<$>` → `newline`、英字列 → `word`、`&...;` → `entity`、それ以外 → `char`）

### 3.3 差分計算

`diff` パッケージ（jsdiff）の `diffArrays` を使用する。

```text
入力: string[]（A）、string[]（B）
  ※ jsdiff の diffArrays は === 比較のためオブジェクトを渡すと全差分になる
  ※ トークンは "${type}\u0000${value}" 形式の安定キー文字列に変換してから渡す
    区切りに NUL（\u0000）を使う。":" だと "INFO:xxx" 等の value と衝突するため

処理:
  1. DiffToken[] → tokenKey[] に変換（例: "word\u0000hello", "newline\u0000<$>"）
  2. diffArrays(tokenKeysA, tokenKeysB) を呼び出し
  3. Change[] → DiffChunk[] に変換（キーから value/type を復元）

変換ルール:
  added=false, removed=false → equal
  removed=true, added=false  → delete
  added=true, removed=false  → insert
  連続する delete+insert     → replace にまとめる（後述）
```

### 3.4 行ズレ正規化

difff.pl 85-91行相当の処理を **diff-engine（lib 側）** で完結させる。
行配列化・空行補完まで終えた `DiffRowModel[]` を `DiffResult.rows` に格納する。
UI（DiffViewer）は `rows` を受け取るだけとし、行分割ロジックを持たない。

```text
方針: トークン列をいじらず、行配列の段階で空行を補完する

処理:
  1. DiffChunk[] を走査し <$> トークンで区切りながら
     A側行配列（rowsA: DiffCellModel[]）と B側行配列（rowsB）を生成

     チャンクタイプ別の処理:
       equal   → <$> で区切り、各行を A・B 両側に type="equal" セグメントとして追加
       delete  → <$> で区切り、各行を A側のみに type="delete" セグメントとして追加
       insert  → <$> で区切り、各行を B側のみに type="insert" セグメントとして追加
       replace → tokensA を <$> で区切って A側行に type="delete"、
                 tokensB を <$> で区切って B側行に type="insert" として追加
                 ※ "replace" は行モデルには出現しない。A/B でそれぞれ独立して行分割する

     <$> トークンの扱い:
       - <$> は行の区切り文字として使用し、生成後の DiffSegment.tokens には含めない

  2. max(rowsA.length, rowsB.length) に揃える
     短い側に空行 { segments: [] } を追加

  3. rowsA[i] と rowsB[i] をペアにして DiffRowModel[] を組み立て
  4. DiffResult.rows として返す

理由: equal チャンクの末尾 newline を複製する方式は、
     equal が存在しない連続差分ケースで破綻するため採用しない
```

### 3.5 末尾スペース処理

difff.pl 112-113行相当。ハイライト範囲の末尾スペース列を `\u00A0`（`&nbsp;`）に変換する。

- DiffRow のレンダリング時に適用する
- ハイライト対象セグメント（`delete` / `insert`）の行末スペースのみを `\u00A0` に置換する
- `equal` 部分は変換しない
- 行配列モデルでは「行の末尾トークンがスペースの場合」が対象（`<$>` 参照不要）

### 3.6 統計計算（countStats）

```text
charWithNewline: 文字列の文字数（CR除去後）
charWithSpace:   改行除去後の文字数
charCount:       空白・改行除去後の文字数
wordCount:       \s*\S+ のマッチ数（difff.pl 互換定義。一般的な「単語数」とは異なり非空白の塊数）

StatsRow での派生計算（フィールド追加不要）:
  spaceCount   = charWithSpace - charCount    // 空白数
  newlineCount = charWithNewline - charWithSpace  // 改行数
```

### 3.7 文字数制限

片側 200,000 文字超で比較を中断し `truncated: true` を返す。

## 4. コンポーネント実装方針

### 4.1 page.tsx（状態管理）

```text
state:
  textA, textB          string
  wordMode              WordMode
  theme                 Theme
  result                DiffResult | null
  error                 string | null

イベント:
  handleCompare()  → diff-engine を呼び出し result をセット（同期処理、isLoading 不要）
  handleSwap()     → textA と textB を入れ替え
```

### 4.2 InputPanel.tsx

- `<textarea>` 2つを横並び
- 各エリアにクリアボタン（×）
- Swap ボタン（A⇄B）を中央に配置
- テキストが両方入力されている場合のみ「比較」ボタンを有効化
- 200,000文字超の場合はリアルタイムで警告表示

### 4.3 OptionsBar.tsx

| オプション   | UI 要素                          |
| ------------ | -------------------------------- |
| 英単語モード | ラジオボタン 2択（互換 / 拡張）  |
| テーマ       | ラジオボタン 3択（色1/色2/モノ） |

### 4.4 DiffViewer.tsx

- `DiffResult.rows`（`DiffRowModel[]`）を受け取り `DiffRow` を生成する
- 行分割・行ズレ補完は diff-engine 側で完結済みのため、ここでは行わない
- `rows[i].a` / `rows[i].b` をペアで `DiffRow` に渡す
- テーマに応じた CSS クラスを適用する

### 4.5 DiffRow.tsx

- 1行分（A側 `DiffCellModel`・B側 `DiffCellModel`）を受け取る
- 各セルの `segments` を順に描画する:
  - `equal` セグメント → 通常テキスト（ハイライトなし）
  - `delete` セグメント → A側セルにのみ背景色ハイライト
  - `insert` セグメント → B側セルにのみ背景色ハイライト
  - `replace` はセグメントレベルでは出現しない（lib 側で delete/insert に分解済み）
- ハイライト対象セグメント（delete / insert）の末尾スペース → `\u00A0` 置換

### 4.6 StatsRow.tsx

- `DiffStats` を受け取り統計を表示する
- difff.pl の表示形式に準拠:

```text
文字数: N
空白数: N  空白込み文字数: N
改行数: N  改行込み文字数: N
単語数: N
```

## 5. テーマ実装

CSS カスタムプロパティで3テーマを切り替える。`data-theme` 属性を `<html>` にセットする方式。

| テーマ | ハイライト色             |
| ------ | ------------------------ |
| color1 | 青系（difff デフォルト） |
| color2 | 緑系                     |
| mono   | グレー系（モノクロ）     |

## 6. インストール・依存関係

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint
npm install diff
npm install -D @types/diff
npx shadcn@latest init
npx shadcn@latest add button textarea radio-group
```

## 7. 実装順序

1. `lib/types.ts` — 型定義
2. `lib/diff-engine.ts` — コアロジック（splitText・diff計算・DiffResult生成）
3. `components/StatsRow.tsx` — 依存なし、単純
4. `components/DiffRow.tsx` — トークンレンダリング
5. `components/DiffViewer.tsx` — DiffRow を組み合わせ
6. `components/InputPanel.tsx` — テキスト入力UI
7. `components/OptionsBar.tsx` — オプション切替UI
8. `app/page.tsx` — 全体統合
9. `app/globals.css` — テーマカラー変数

## 8. 受け入れ条件チェックリスト

| #   | 条件                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------- |
| 1   | difff と同様に英単語（小文字）が単語単位でハイライトされる                                                |
| 2   | 英単語分割モードを UI から切り替えられる（大文字対応 ON/OFF）                                             |
| 3   | 日本語混在テキストで 1 文字単位の差分がハイライトされる                                                   |
| 4   | A/B の改行数が異なるテキストでも 2 カラムの行がズレない                                                   |
| 5   | 改行を含む差分でも表示が崩れない（`<$>` 相当が正しく機能）                                                |
| 6   | ハイライト内の末尾スペースが視覚的に正しく表示される                                                      |
| 7   | 2 カラム表示で比較可能                                                                                    |
| 8   | HTML を入力しても表示が崩れない（React の通常描画により自動エスケープ。`dangerouslySetInnerHTML` 不使用） |
| 9   | 200,000 文字超の入力で警告が出て比較が無効になる                                                          |
