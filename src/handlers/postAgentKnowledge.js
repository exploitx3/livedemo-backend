import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import enqueueIndexAgentKnowledge from '../helpers/agent/enqueueIndexJob.js'
import { faqToText, stripHtml } from '../helpers/agent/agentKnowledge.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { sendJson, sendError, httpError } from '../helpers/agent/http.js'

// POST /workspaces/:workspaceId/agents/:agentId/knowledge
// JSON:      { type: 'text'|'faq'|'url', title, rawText | faq: [{q,a}] | url }
// multipart: { type: 'file', file } (pdf, md, txt, html)
//
// PDFs ≤4MB: base64 stored for native gemini-embedding-2 embed (≤6 pages).
// Larger or multi-page PDFs: text extraction + chunked text embeddings.
const PDF_MAX_STORE_BYTES = 4 * 1024 * 1024

async function extractFileText(file) {
  const name = (file.originalname || '').toLowerCase()
  const isPdf = name.endsWith('.pdf') || file.mimetype === 'application/pdf'

  if (isPdf) {
    const { default: pdfParse } = await import('pdf-parse')
    const parsed = await pdfParse(file.buffer)
    return {
      text: parsed.text || '',
      pageCount: parsed.numpages || 0,
      isPdf: true,
      fileBase64: file.buffer.length <= PDF_MAX_STORE_BYTES
        ? file.buffer.toString('base64')
        : '',
    }
  }

  const text = file.buffer.toString('utf8')
  if (name.endsWith('.html') || name.endsWith('.htm') || file.mimetype === 'text/html') {
    return { text: stripHtml(text), pageCount: 0, isPdf: false, fileBase64: '' }
  }

  return { text, pageCount: 0, isPdf: false, fileBase64: '' }
}

const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId } = req.params
  const body = req.body || {}

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const agent = await loadAgentInWorkspace(Models, workspaceId, agentId)

    const type = body.type
    const sourceObj = {
      agentId: agent._id,
      workspaceId: agent.workspaceId,
      type,
      title: body.title || '',
      status: 'pending',
    }

    if (type === 'text') {
      if (!body.rawText) httpError(ResponseCodes['400_BAD_REQUEST'], 'rawText is required')
      sourceObj.rawText = body.rawText
    } else if (type === 'faq') {
      const faqPairs = typeof body.faq === 'string' ? JSON.parse(body.faq) : body.faq
      sourceObj.rawText = body.rawText || faqToText(faqPairs)
      if (!sourceObj.rawText) httpError(ResponseCodes['400_BAD_REQUEST'], 'faq pairs are required')
    } else if (type === 'url') {
      if (!body.url) httpError(ResponseCodes['400_BAD_REQUEST'], 'url is required')
      sourceObj.url = body.url
      if (!sourceObj.title) sourceObj.title = body.url
    } else if (type === 'file') {
      if (!req.file) httpError(ResponseCodes['400_BAD_REQUEST'], 'file is required')
      const extracted = await extractFileText(req.file)
      sourceObj.rawText = extracted.text
      sourceObj.fileName = req.file.originalname
      sourceObj.mimeType = req.file.mimetype
      sourceObj.pageCount = extracted.pageCount || 0
      if (extracted.fileBase64) sourceObj.fileBase64 = extracted.fileBase64
      if (!sourceObj.title) sourceObj.title = req.file.originalname
    } else {
      // 'demo' sources are created by the Demos tab (patchAgent), never here
      httpError(ResponseCodes['400_BAD_REQUEST'], 'Invalid source type')
    }

    const source = await new Models.AgentKnowledgeSource(sourceObj).save()
    await Models.AiDemoAgent.updateOne(
      { _id: agent._id },
      { $addToSet: { knowledgeSourceIds: source._id } }
    )

    enqueueIndexAgentKnowledge(agent._id, source._id)
      .catch(err => console.log('enqueue indexAgentKnowledge failed', err))

    sendJson(res, source)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
