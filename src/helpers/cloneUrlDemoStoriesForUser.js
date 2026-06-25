import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

/**
 * Finds all completed UrlDemos linked to browserSessionId that have no userId,
 * clones their storyDocs into the user's first workspace, and marks them with userId.
 */
export async function cloneUrlDemoStoriesForUser(browserSessionId, userDoc, Models) {
  if (!browserSessionId || !userDoc) return

  const workspaceId = userDoc.workspaces?.[0]
  if (!workspaceId) return

  const urlDemos = await Models.UrlDemo.find({
    browserSessionId,
    status: 'completed',
    userId: { $exists: false },
    storyId: { $exists: true }
  }).lean()

  if (!urlDemos.length) return

  const storyIds = urlDemos.map(d => d.storyId).filter(Boolean)

  const stories = await Models.Story.find({
    _id: { $in: storyIds }
  }).populate('screens').lean()

  const urlDemoIds = []

  for (const storyDoc of stories) {
    const newStoryId = new ObjectId()
    const screenPromises = (storyDoc.screens || []).map(screen => {
      return new Models.Screen({
        ...screen,
        _id: new ObjectId(),
        storyId: newStoryId,
        workspaceId: workspaceId
      }).save()
    })

    const savedScreens = await Promise.all(screenPromises)
    const screenIds = savedScreens.map(s => s._id)

    await new Models.Story({
      ...storyDoc,
      _id: newStoryId,
      userId: userDoc._id,
      workspaceId: workspaceId,
      screens: screenIds
    }).save()

    const matchingDemo = urlDemos.find(d => d.storyId?.toString() === storyDoc._id.toString())
    if (matchingDemo) {
      urlDemoIds.push(matchingDemo._id)
    }
  }

  if (urlDemoIds.length) {
    await Models.UrlDemo.updateMany(
      { _id: { $in: urlDemoIds } },
      { $set: { userId: userDoc._id } }
    )
  }
}
