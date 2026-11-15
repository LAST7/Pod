# Pod — Product Requirements

Status: personal project; exploratory prototype. Not a commercial product.

## Product vision

Pod is a personal AI steward for capturing, organizing, recalling, and—when appropriate—acting on information. It should reduce the effort and anxiety of remembering what matters without turning life into a productivity system.

> Help me remember what I care about; do not optimize me as if I were a machine.

The user may rest, defer, abandon an idea, keep something only as memory, or do nothing. No scores, streaks, completion guilt, or assumption that every thought is work.

The intended feel is closer to a personal companion (Jarvis / Pod) than a coding agent, autonomous worker, or app-generation platform. A model/runtime is replaceable infrastructure, not the product.

## Core workflow

```text
Capture arbitrary information
  -> preserve the raw input
  -> retrieve relevant personal context
  -> interpret it into evidence-backed proposals
  -> user reviews, edits, approves, rejects, defers, or keeps as memory
  -> apply approved changes
  -> later recall the result with its source
```

A capture can yield knowledge, tasks, project updates, agenda items, pending decisions, reminders, references, or no action. One capture may yield multiple proposals. Never silently convert all input into obligations.

## Agency and trust

Default to suggest-only. The model may analyze, search, classify, summarize, link records, and prepare drafts. Require explicit approval before creating commitments, changing calendar events or important records, sending messages, or otherwise taking consequential external action.

Support approve, edit, reject, defer, keep as memory, archive, intentional abandonment, and clarification. Show the source/evidence and proposed changes. Record the proposal and its review/application outcome. The application—not the model—validates structured output, resolves record IDs, enforces permissions, and applies changes.

Procedures, if introduced, must be explicit and bounded: trigger, instructions, context, expected output, allowed tools, approval policy, and failure/audit behavior. No unrestricted always-running autonomous loop.

## Experience

The primary surface is a calm GUI, not a TUI. The main interaction should support quick capture, proposal review, recall with evidence, and a temporal agenda. The agenda should make duration, overlap, dependencies, and available time understandable without productivity scoring. Obsidian may be an integration, not necessarily the primary interface.

Desktop can provide rich review and timeline editing; mobile/web should make capture, inbox review, approval, and agenda access convenient. These are product directions, not requirements to build native clients in the first prototype.

## Model and runtime

Prefer configurable providers/BYOK and keep durable context independent of provider conversation memory. Use a capable fast model for routine structured work where testing supports it; reserve stronger models for difficult ambiguity. Start with simple retrieval (for example SQLite FTS5 and metadata); add embeddings or reranking only when demonstrated useful.

The model proposes. Deterministic application code validates, authorizes, persists, and audits. Agent Session history may preserve conversation, tool calls, branches, or context state, but it is not the system of record for captures, proposals, approvals, tasks, projects, or audit history.

## Data and privacy

Keep raw captures and their provenance. Proposals should retain enough context to explain what was suggested and what the user decided. Data must remain exportable and independent of any one model vendor.

A hybrid is a plausible direction: SQLite for transactional workflow, relationships, search indexes, and operational state; Markdown/Obsidian for human-readable knowledge and records the user wants to edit directly. Do not force every state into Markdown or make a proprietary database the only copy of personal knowledge.

Clearly disclose when data leaves the device. Future privacy modes may include hosted processing, per-capture choice, local-only areas, and sensitivity recommendations. A local UI using a remote model is not fully local.

## Future architecture (not initial scope)

Mobile capture, synchronization, scheduling, and notifications are important longer-term directions. Possible shape: desktop client for rich review and local integrations; mobile/web for capture and approval; optional hosted service for sync and scheduling; optional local companion for private files and device functions. Hosted, encrypted-sync, local-first relay, and self-hosted deployments have distinct privacy and operational tradeoffs; do not promise server-side reasoning over data that remains undecrypted.

Calendar access should begin read-only or proposal-only; require approval to create or modify events. Notifications should be non-moralizing. Messaging, broad MCP access, voice, and autonomous external actions are later extensions, not initial capabilities.

## Initial boundary

Validate one narrow capture-to-proposal loop:

1. Capture text and preserve the original.
2. Retrieve a small amount of relevant context.
3. Call one configurable model and validate structured output.
4. Show evidence-backed proposals, including a valid “no action” result.
5. Let the user edit, approve, reject, defer, or keep as memory.
6. Persist the decision and resulting record; show basic agenda placement only if needed to test the workflow.

Do not begin with always-on autonomy, messaging, full calendar mutation, broad MCP execution, voice, collaboration, a full Obsidian/Dida replacement, or native mobile apps. Add capabilities only when the core workflow demonstrates a need.

## References to inspect (similar products)

- [Local LLM Helper](https://github.com/manimohans/obsidian-local-llm-helper) — vault search, cited suggestions, and approval-gated writes.
- [Obsidian Personal Assistant](https://github.com/edonyzpc/personal-assistant) — vault assistant and review suggestions.
- [QwenPaw](https://github.com/agentscope-ai/QwenPaw) — memory, scheduling, tools, and governance; broader/more autonomous than Pod.
- [Khoj](https://docs.khoj.dev/) — self-hosted knowledge retrieval and multiple clients.
- [GAIA](https://heygaia.io/open-source-ai-assistant) — email/calendar/task integrations.
- [Ariv](https://ariv.one/) — notes, tasks, calendar, and search.

These are research leads, not a prescribed implementation or feature checklist.

## Success criterion

The project succeeds if it makes it easier to remember and place important information while respecting the user's freedom not to optimize every part of life. A personal prototype is worthwhile even if it never becomes a business.
