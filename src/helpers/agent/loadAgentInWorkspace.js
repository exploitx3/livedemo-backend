import ResponseCodes from '../../constants/ResponseCodes.js'
import { httpError } from './http.js'

// Every editor route loads the agent through this. If the agent exists but in
// another workspace, it's a plain 404 — never distinguish "wrong workspace"
// from "missing", so workspace A's auth can't probe workspace B's agents.
export default async function loadAgentInWorkspace(Models, workspaceId, agentId) {
  const agent = await Models.AiDemoAgent.findOne({
    _id: agentId,
    workspaceId,
    deletedAt: null,
  })

  if (!agent) {
    httpError(ResponseCodes['404_NOT_FOUND'], 'Agent not found')
  }

  return agent
}
