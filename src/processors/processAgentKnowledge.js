import axios from 'axios'
import aiHelpers from '../helpers/aiHelpers.js'
import { chunkText, storyToChunks, stripHtml } from '../helpers/agent/agentKnowledge.js'

// monq job: indexAgentKnowledge { agentId, sourceId? }
// extract → chunk → embed → deleteMany-then-insertMany chunks → status ready.
// sourceId null = reindex every source of the agent (Demos-tab save, revert).

async function extractSourceText(Models, source) {
  if (source.type === 'url') {
    const response = await axios.get(source.url, { timeout: 20000, maxContentLength: 5 * 1024 * 1024 })
    return stripHtml(String(response.data))
  }

  // text / faq / file: text was stored as rawText at upload time
  return source.rawText || ''
}

// extract → chunk → embed → deleteMany-then-insertMany chunks → status ready.
// PDFs (≤6 pages, stored base64): native gemini-embedding-2 multimodal embed.

function canUseNativePdfEmbed(source) {
  return source.type === 'file'
    && source.mimeType === 'application/pdf'
    && source.fileBase64
    && (source.pageCount || 0) > 0
    && source.pageCount <= aiHelpers.PDF_MAX_NATIVE_PAGES
}

async function indexOneSource(Models, agent, source) {
  await Models.AgentKnowledgeSource.updateOne(
    { _id: source._id },
    { $set: { status: 'indexing', errorMessage: '' } }
  )

  try {
    let chunkEntries = []
    let embeddings = []

    if (source.type === 'demo') {
      // Read-only read of the existing Story graph; never writes Story
      const story = await Models.Story.findOne({ _id: source.demoId, deletedAt: null })
        .populate({
          path: 'screens',
          select: '_id name steps index',
        })
        .lean()

      if (!story) {
        throw new Error('Story not found for demo source')
      }

      chunkEntries = storyToChunks(story)
    } else if (canUseNativePdfEmbed(source)) {
      const text = await extractSourceText(Models, source)
      chunkEntries = [{
        text: text.slice(0, 2400) || source.title || source.fileName || 'PDF document',
        metadata: {
          title: source.title,
          fileName: source.fileName,
          pageCount: source.pageCount,
          pdfNative: true,
        },
      }]
      console.log(`indexAgentKnowledge native PDF embed (${source.pageCount} pages) for source ${source._id}`)
      embeddings = [await aiHelpers.embedPdfDocument(source.fileBase64)]
    } else {
      const text = await extractSourceText(Models, source)
      chunkEntries = chunkText(text).map(t => ({
        text: t,
        metadata: { title: source.title, url: source.url || undefined },
      }))
    }

    if (!embeddings.length) {
      const texts = chunkEntries.map(e => e.text)
      if (texts.length) {
        console.log(`indexAgentKnowledge embedding ${texts.length} chunks for source ${source._id}`)
      }
      embeddings = texts.length ? await aiHelpers.embedTexts(texts, {
        taskType: 'RETRIEVAL_DOCUMENT',
        title: source.title || undefined,
      }) : []
    }

    const docs = chunkEntries.map((entry, i) => ({
      agentId: agent._id,
      workspaceId: agent.workspaceId,
      sourceId: source._id,
      sourceType: source.type,
      text: entry.text,
      embedding: embeddings[i],
      metadata: entry.metadata || {},
    }))

    await Models.AgentKnowledgeChunk.deleteMany({ sourceId: source._id, agentId: agent._id })
    if (docs.length) {
      await Models.AgentKnowledgeChunk.insertMany(docs)
    }

    await Models.AgentKnowledgeSource.updateOne(
      { _id: source._id },
      { $set: { status: 'ready', chunkCount: docs.length } }
    )
  } catch (err) {
    console.log('indexAgentKnowledge source failed', source._id.toString(), err)
    await Models.AgentKnowledgeSource.updateOne(
      { _id: source._id },
      { $set: { status: 'error', errorMessage: err.message || 'Indexing failed' } }
    )
  }
}

function processAgentKnowledge(sharedConfig, params, callback) {
  const { Models } = sharedConfig
  const { agentId, sourceId } = params

  return Promise.resolve()
    .then(async () => {
      const agent = await Models.AiDemoAgent.findOne({ _id: agentId, deletedAt: null }).lean()
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`)
      }

      const query = sourceId ? { _id: sourceId, agentId } : { agentId }
      const sources = await Models.AgentKnowledgeSource.find(query).lean()

      // Sequential on purpose: embed API rate limits beat parallel speed here
      for (const source of sources) {
        await indexOneSource(Models, agent, source)
      }
    })
    .then(() => {
      callback(null, { agentId, sourceId })
    })
    .catch((err) => {
      console.log('processAgentKnowledge failed', err)
      callback(err)
    })
}

const config = {
  queueNames: ['agent-knowledge'],
  jobNames: ['indexAgentKnowledge'],
  handler: processAgentKnowledge,
}

export default config
