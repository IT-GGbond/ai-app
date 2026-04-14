---
description: "Use when: 提交代码、push远程、更新doc/prList.md、生成commit说明、方法原理说明"
---

# 提交并更新 PR 记录

目标：在当前工作区自动完成以下流程。

1. 检查 git 状态并汇总本次改动。
2. 先更新 `doc/prList.md`：

- 在文末新增一条记录，格式为：`### N. 标题（YYYY-MM-DD）`。
- 紧跟 2-4 行说明：
- 本次变更内容。
- 方法/实现原理（为什么这么做）。
- 风险或回滚点（可选）。

3. 生成 commit message：

- 优先使用 Conventional Commits：`feat:` `fix:` `refactor:` `docs:`。
- 标题和正文使用中文
- 标题不超过 72 字符。
- 正文包含一段“方法/原理说明”。

4. 执行提交与推送：

- `git add -A`
- `git commit -m "<标题>" -m "<方法/原理说明>"`
- `git push`

5. 输出执行结果：

- 实际提交 hash。
- 推送的远程与分支。
- `doc/prList.md` 新增条目的完整文本。

执行约束：

- 若没有可提交变更，明确提示并停止，不要空提交。
- 若 push 失败，保留本地 commit，并给出修复建议。
- 不改动与本次任务无关的文件。
