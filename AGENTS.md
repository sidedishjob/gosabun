# AGENTS.md

This file provides guidance to AI Agents (open.ai/codex, claude.ai/claude code) when working with code in this repository.

---

## 変更方針（Change policy）

- 明示的に指示された内容は必ず実装する。
- より良い設計・実装案がある場合は **必ず提案する**。
- 提案内容は、指示や承認がない限り **実装してはならない**。

※「より良さそう」「一般的にはこう」を理由に、
指示外の変更を黙って混ぜることを禁止する。

---

## 変更範囲の制御（Scope control）

- 指示に含まれていないファイルは原則変更しない。
- 指示内容を実現するために **必要な変更のみ例外として許可**する。
- 追加改善・リファクタリング案がある場合は、実装せず提案に留める。

---

## 判断方針（Decision making）

- 判断に迷う場合は独断で決めず、質問または提案を行う。
- 即時に質問できない場合は **現状維持**を選択する。

---

## レビュー方針（Review guidelines）

- PRレビューコメントは必ず日本語で書く。
- 指摘タイトル・本文ともに日本語で記載する。

---

## コードスタイル（Code style）

- Prettier: `printWidth: 100`（1行100文字以内に収めること）
- ESLint: `react-hooks/set-state-in-effect`（useEffect 内での setState 禁止）、`react-hooks/refs`（レンダー中の ref アクセス禁止）が有効

---

## 品質ゲート（Quality gates）

実装・修正後は必ず以下のコマンドを実行する。

```bash
npm run lint && npm run format:check
```

- すべて成功するまで作業完了としない。
- エラーがある場合は必ず修正する。

---

## コミットメッセージ（Commit message）

ファイルの修正を加えて作業が一段落した際は、必ずコミットメッセージの提案を行うこと。

- 詳細ルール（prefix 判定、形式、禁止事項、例外）は `docs/rules/commit-message-rule.md` を参照する。
- 本ファイルにはコミット運用の重複定義を持たない。

---

## PR作成ルール（Pull request）

- Claude Code: `/create-pr` スキルを使用する。
- 人間が対話的に作成する場合は `gh pr create -T .github/pull_request_template.md` を使う。
- その他のエージェント: `.claude/skills/create-pr/SKILL.md` を参照して実行する。

---

## 作業進捗管理（Task progress tracking）

AIエージェントが作業指示を受けた場合、以下の手順で進捗を管理すること。

### ToDo ファイルの作成

- 作業開始時に、タスクを分解した ToDo ファイルを作成する。
- 保存先・命名規則は「計画 / 調査ルール」に従う（`docs/tasks/<task_key>/todo_<task_key>.md`）。
- 各タスクはチェックボックス形式（`- [ ]` / `- [x]`）で記載する。

### 進捗の更新

- 各タスクの着手時・完了時に ToDo ファイルを更新する。
- 作業中に新たなタスクが発生した場合は ToDo ファイルに追記する。
- 「コミットメッセージ提案」タスクは、提案した時点で完了（`- [x]`）とする。
- すべてのタスクが完了したら、ファイル先頭に完了を示すステータスを付与する。

### 対象外

- 単一の軽微な修正（タイポ修正、1 ファイルの小さな変更など）は ToDo ファイル不要。

---

## 計画 / 調査ルール（Plan / research output）

以下の種類のアウトプットを生成した場合は、
必ず Markdown ファイルとして保存すること。

対象:

- 実行計画（plan / roadmap / step）
- ToDo リスト
- 調査結果・比較・検討メモ

### 保存先

| 区分               | 保存先                   |
| ------------------ | ------------------------ |
| 全エージェント共通 | `docs/tasks/<task_key>/` |

- `task_key` は作業単位を表す短い英語名（kebab-case）とする。
- 1 作業 = 1 フォルダで管理し、同一作業の plan / todo / research を同一フォルダに保存する。

### ファイル命名規則

- `plan_<task_key>.md`
- `todo_<task_key>.md`
- `research_<task_key>.md`

例（`task_key = contact-form-validation`）:

- `docs/tasks/contact-form-validation/plan_contact-form-validation.md`
- `docs/tasks/contact-form-validation/todo_contact-form-validation.md`
- `docs/tasks/contact-form-validation/research_contact-form-validation.md`

### コミット対象外

- `docs/tasks/` 配下のファイルは一切 git commit に含めないこと。
- `git add` の対象にしてはならない。

### 出力ルール

1. まず Markdown 本文を構成する
2. 次に `docs/tasks/<task_key>/` を作成し、必ずファイルに書き出す
3. チャットには要約のみを表示する

### Todo タスクアーカイブ

- Claude Code: `/todo-archive` スキルを使用する。
  - ユーザーが「todo comp」と発言した場合も `/todo-archive` スキルを実行すること。
- その他のエージェント: `docs/rules/todo-archive-rule.md` を参照して実行する。
