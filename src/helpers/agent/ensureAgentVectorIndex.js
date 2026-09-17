import ENV from '../../envServer.js'

const INDEX_NAME = 'agent_chunks_vector'
const EMBED_DIMS = 768 // gemini-embedding-2 — keep in sync with aiHelpers.js

// Self-managed MongoDB 8.2+ (mongot) and Atlas both use createSearchIndex +
// $vectorSearch with the same index shape. Idempotent: skip if index exists.
export default async function ensureAgentVectorIndex(conn) {
  if (ENV.VECTOR_SEARCH === 'off') return

  const collection = conn.model('AgentKnowledgeChunk').collection
  const collectionName = collection.collectionName

  try {
    for await (const idx of collection.listSearchIndexes()) {
      if (idx.name === INDEX_NAME) {
        console.log(`vector index ${INDEX_NAME} already on ${collectionName}`)
        return
      }
    }
  } catch (err) {
    console.log(`listSearchIndexes failed (${collectionName}): ${err.message}`)
    console.log('mongot running? mongod needs searchIndexManagementHostAndPort + mongotHost')
    return
  }

  const indexDef = {
    name: INDEX_NAME,
    type: 'vectorSearch',
    definition: {
      fields: [
        { type: 'vector', path: 'embedding', numDimensions: EMBED_DIMS, similarity: 'cosine' },
        { type: 'filter', path: 'workspaceId' },
        { type: 'filter', path: 'agentId' },
        { type: 'filter', path: 'sourceType' },
      ],
    },
  }

  try {
    if (typeof collection.createSearchIndex === 'function') {
      await collection.createSearchIndex(indexDef)
    } else {
      await conn.db.command({ createSearchIndexes: collectionName, indexes: [indexDef] })
    }
    console.log(`created vector index ${INDEX_NAME} on ${collectionName}`)
  } catch (err) {
    if (/already exists|duplicate/i.test(err.message)) return
    console.log(`ensureAgentVectorIndex failed: ${err.message}`)
  }
}
