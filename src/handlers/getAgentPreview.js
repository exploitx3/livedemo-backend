import helpers from '../helpers/livedemoHelpers.js'
import loadPublicAgent from '../helpers/agent/loadPublicAgent.js'
import { getAllowedDemos, validateDemoAction } from '../helpers/agent/validateActions.js'
import { sendJson, sendError } from '../helpers/agent/http.js'
import { usesAnamVoice } from '../helpers/agent/anam.js'

// Workspace members previewing with auth see draft defaults (editor mode).
// Anonymous visitors only see published defaults.
async function resolvePreviewMode(req, Models, agent) {
  if (req.agentMode === 'editor') return 'editor'
  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, String(agent.workspaceId))
    return 'editor'
  } catch {
    return 'published'
  }
}

async function resolveDefaultDemoId(Models, agent, mode) {
  if (!agent.defaultDemoId) return null

  if (mode === 'editor') {
    const story = await Models.Story.findOne({
      _id: agent.defaultDemoId,
      workspaceId: agent.workspaceId,
      deletedAt: null,
    }).select('_id').lean()
    return story ? String(story._id) : null
  }

  const validated = await validateDemoAction(Models, agent, mode, agent.defaultDemoId, 1)
  return validated ? String(validated.demoId) : null
}

// GET /agents/:agentId/preview — public payload behind the publish gate.
// Never returns systemPrompt, knowledge text, or story screens.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const agentId = req.params.agentId

  try {
    const agent = await loadPublicAgent(req, Models, agentId)
    const mode = await resolvePreviewMode(req, Models, agent)
    const allowedDemos = await getAllowedDemos(Models, agent, mode)
    const defaultDemoId = await resolveDefaultDemoId(Models, agent, mode)

    sendJson(res, {
      agent: {
        _id: agent._id,
        name: agent.name,
        workspaceId: String(agent.workspaceId),
        welcomeMessage: agent.welcomeMessage,
        starterQuestions: agent.starterQuestions,
        avatarUrl: agent.avatarUrl,
        voiceEnabled: agent.voiceEnabled,
        avatarsEnabled: !!agent.avatarsEnabled,
        anamAvatarId: agent.anamAvatarId || '',
        avatarVoice: usesAnamVoice(agent) ? 'anam' : 'elevenlabs',
        visitorCapture: agent.visitorCapture,
        cta: agent.cta,
        isPublished: agent.isPublished,
        defaultDemoId,
      },
      allowedDemos: allowedDemos.map(d => ({
        _id: d._id,
        name: d.name,
        thumbnailImageUrl: d.thumbnailImageUrl || '',
      })),
    })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
