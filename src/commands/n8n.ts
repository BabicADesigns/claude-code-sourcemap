import { Command } from '../commands.js'
import { BashTool } from '../tools/BashTool/BashTool.js'

const N8N_SUBCOMMANDS = `
Available subcommands:
  list              List all workflows
  activate <id>     Activate a workflow by ID
  deactivate <id>   Deactivate a workflow by ID
  run <id>          Trigger a workflow execution by ID
  executions <id>   Show recent executions for a workflow
  webhook <url>     Trigger a webhook URL (GET or POST with optional JSON body)
  create            Create a new workflow from a natural language description
  help              Show this help message
`

export default {
  type: 'prompt',
  name: 'n8n',
  description: 'Interact with n8n workflows (list, trigger, create, manage)',
  isEnabled: true,
  isHidden: false,
  progressMessage: 'working with n8n',
  userFacingName() {
    return 'n8n'
  },
  async getPromptForCommand(args: string) {
    const trimmed = args.trim()

    return [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `You are an expert in n8n workflow automation. Help the user interact with their n8n instance.

N8N_BASE_URL and N8N_API_KEY environment variables configure the connection:
- N8N_BASE_URL: base URL of the n8n instance (e.g. http://localhost:5678)
- N8N_API_KEY: n8n API key for authentication

When making API calls, always use:
  - Base URL from N8N_BASE_URL env var (default to http://localhost:5678 if not set)
  - Header: X-N8N-API-KEY with value from N8N_API_KEY env var
  - Content-Type: application/json for POST/PATCH requests

n8n REST API endpoints (v1):
  GET    /api/v1/workflows                         List workflows
  GET    /api/v1/workflows/:id                     Get workflow details
  POST   /api/v1/workflows                         Create a workflow
  PUT    /api/v1/workflows/:id                     Update a workflow
  DELETE /api/v1/workflows/:id                     Delete a workflow
  POST   /api/v1/workflows/:id/activate            Activate a workflow
  POST   /api/v1/workflows/:id/deactivate          Deactivate a workflow
  GET    /api/v1/executions?workflowId=:id         List executions
  GET    /api/v1/executions/:id                    Get execution details
  POST   /api/v1/workflows/:id/run                 Trigger a workflow run

Use ${BashTool.name} with curl to make API calls. Always read N8N_BASE_URL and N8N_API_KEY from the environment.

Example curl pattern:
  curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_BASE_URL/api/v1/workflows" | jq .

${N8N_SUBCOMMANDS}

The user's request: ${trimmed || 'list workflows'}

Follow these steps:
1. Determine what the user wants to do based on their request.
2. If N8N_BASE_URL or N8N_API_KEY are not set in the environment, inform the user and provide setup instructions.
3. Use ${BashTool.name} with appropriate curl commands to interact with the n8n API.
4. Present results in a clear, readable format using jq for JSON parsing.
5. For workflow creation requests, generate a valid n8n workflow JSON structure based on the user's description and POST it to /api/v1/workflows.
6. When creating workflows, always include at minimum: a Start/Manual Trigger node and at least one action node.

If the user requests help or provides no subcommand, show the available subcommands and example usage.
`,
          },
        ],
      },
    ]
  },
} satisfies Command
