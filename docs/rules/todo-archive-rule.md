# Todo タスクアーカイブルール

## トリガー

ユーザーから「todo comp」の明示指示があった場合に実行する。

## 手順

1. `docs/tasks/` 配下の完了済みタスクフォルダ（`<task_key>`）を特定する
2. アーカイブ先を作成し、フォルダを移動する

   ```bash
   mkdir -p docs/_old/tasks
   mv docs/tasks/<task_key> docs/_old/tasks/
   ```

3. 同名フォルダが `docs/_old/tasks/` に既に存在する場合は `<task_key>_YYYYMMDD` にリネームしてから移動する
