import ENV from '../../envServer.js'

function stripSlash(value) {
  return String(value || '').replace(/\/$/, '')
}

function parseUrl(urlParam) {
  try {
    return new URL(urlParam)
  } catch {
    return null
  }
}

function originAllowed(origin, origins) {
  const allowed = (origins || [ENV.STORIES_API, ENV.SERVER_URL, ENV.STORY_API])
    .filter(Boolean)
    .map(stripSlash)
  return allowed.includes(stripSlash(origin))
}

// Story preview:  {STORIES_API}/workspaces/:ws/stories/:id/preview
// Agent preview:  {STORIES_API}/workspaces/:ws/agents/:id/preview
// Public agent:   {STORIES_API}/agents/:id/preview  or  {SERVER_URL}/agents/:id
export function parseOEmbedUrl(urlParam, origins) {
  if (!urlParam) return null
  const parsed = parseUrl(urlParam)
  if (!parsed || !originAllowed(parsed.origin, origins)) return null

  const path = parsed.pathname.replace(/\/$/, '') || '/'

  let m = path.match(/^\/workspaces\/([^/]+)\/stories\/([^/]+)(?:\/preview)?$/)
  if (m) return { kind: 'story', workspaceId: m[1], id: m[2] }

  m = path.match(/^\/workspaces\/([^/]+)\/agents\/([^/]+)(?:\/preview)?$/)
  if (m) return { kind: 'agent', workspaceId: m[1], id: m[2] }

  m = path.match(/^\/agents\/([^/]+)(?:\/preview)?$/)
  if (m) return { kind: 'agent', id: m[1] }

  m = path.match(/^\/(?:livedemos|preview)\/([^/]+)$/)
  if (m) return { kind: 'story', id: m[1] }

  return null
}
