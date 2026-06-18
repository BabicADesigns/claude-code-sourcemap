# Engineering Skills

97 engineering-focused skills ported from the `engineering/` and `engineering-team/` directories of [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) (345 skills total across many business domains, MIT licensed). Only the engineering subset was vendored here; each skill is a self-contained `SKILL.md` (plus any bundled `references/`, `scripts/`, or `assets/`) that Claude Code can discover and load by name or description.

Two multi-skill plugins from the upstream `engineering-team/` directory — `playwright-pro` and `self-improving-agent` — were intentionally left out. Both bundle their own hooks, subagents, and (for `playwright-pro`) standalone MCP server integrations rather than a plain `SKILL.md`, which is a different risk/operational profile than the passive, on-demand skills vendored below.

## Architecture & System Design

- `agent-designer`
- `agent-workflow-designer`
- `api-design-reviewer`
- `database-designer`
- `database-schema-designer`
- `mcp-server-builder`
- `senior-architect`
- `tech-stack-evaluator`

## Cloud & Infrastructure

- `aws-solution-architect`
- `azure-cloud-architect`
- `docker-development`
- `env-secrets-manager`
- `gcp-cloud-architect`
- `helm-chart-builder`
- `kubernetes-operator`
- `secrets-vault-manager`
- `snowflake-development`
- `terraform-patterns`

## Security

- `ai-security`
- `cloud-security`
- `incident-commander`
- `incident-response`
- `red-team`
- `security-guidance`
- `security-pen-testing`
- `senior-secops`
- `senior-security`
- `skill-security-auditor`
- `threat-detection`

## DevOps, SRE & Reliability

- `chaos-engineering`
- `ci-cd-pipeline-builder`
- `dependency-auditor`
- `feature-flags-architect`
- `git-worktree-manager`
- `migration-architect`
- `monorepo-navigator`
- `observability-designer`
- `runbook-generator`
- `senior-devops`
- `slo-architect`

## Data, ML & Analytics

- `data-quality-auditor`
- `performance-profiler`
- `rag-architect`
- `senior-computer-vision`
- `senior-data-engineer`
- `senior-data-scientist`
- `senior-ml-engineer`
- `sql-database-assistant`
- `statistical-analyst`

## Backend, Frontend, Product & Integrations

- `a11y-audit`
- `browser-automation`
- `email-template-builder`
- `epic-design`
- `full-page-screenshot`
- `google-workspace-cli`
- `interview-system-designer`
- `ms365-tenant-manager`
- `senior-backend`
- `senior-frontend`
- `senior-fullstack`
- `stripe-integration-expert`

## Testing, Review & Code Quality

- `adversarial-reviewer`
- `api-test-suite-builder`
- `code-reviewer`
- `focused-fix`
- `pr-review-expert`
- `senior-qa`
- `ship-gate`
- `skill-tester`
- `tdd-guide`
- `tech-debt-tracker`

## AI/Agent Tooling & Prompting

- `agenthub`
- `autoresearch-agent`
- `karpathy-coder`
- `llm-cost-optimizer`
- `llm-wiki`
- `prompt-governance`
- `senior-prompt-engineer`
- `universal-scraping-architect`
- `workflow-builder`
- `write-a-skill`

## Workflow, Collaboration & Docs

- `behuman`
- `caveman`
- `changelog-generator`
- `claude-coach`
- `code-tour`
- `codebase-onboarding`
- `collab-proof`
- `demo-video`
- `engineering-advanced-skills`
- `engineering-skills`
- `grill-me`
- `grill-with-docs`
- `handoff`
- `self-eval`
- `spec-driven-workflow`
- `tc-tracker`

Each skill carries an MIT license per its `SKILL.md` frontmatter, matching the upstream repository's license.
