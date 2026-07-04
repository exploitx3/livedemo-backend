import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

function remapStepsGotoScreen(steps, remapGotoScreen) {
  return (steps || []).map(step => {
    const buttons = step?.view?.popup?.buttons
    if (!buttons?.length) return step

    return {
      ...step,
      view: {
        ...step.view,
        popup: {
          ...step.view.popup,
          buttons: buttons.map(button => ({
            ...button,
            gotoScreen: remapGotoScreen(button.gotoScreen)
          }))
        }
      }
    }
  })
}

function remapTransitionsGotoScreen(transitions, remapGotoScreen) {
  return (transitions || []).map(transition => ({
    ...transition,
    gotoScreen: remapGotoScreen(transition.gotoScreen)
  }))
}

export async function cloneStoryForUser(storyId, userId, workspaceId, Models) {
  const storyDoc = await Models.Story.findById(storyId).populate('screens').lean()
  if (!storyDoc) return null

  const newStoryId = new ObjectId()
  const oldScreens = storyDoc.screens || []

  // Pre-generate new screen ids up front so gotoScreen references (which point
  // at a screen's `index` field) can be remapped to the screen sharing that
  // same `index` value in the cloned list before the screens are saved.
  const newScreenIds = oldScreens.map(() => new ObjectId())
  const firstNewScreenId = newScreenIds[0] || null

  const oldScreenIdToScreenIndex = new Map(
    oldScreens.map(screen => [screen._id.toString(), screen.index])
  )
  const newScreenIdByScreenIndex = new Map(
    oldScreens.map((screen, i) => [screen.index, newScreenIds[i]])
  )

  const remapGotoScreen = (gotoScreenId) => {
    if (!gotoScreenId) return gotoScreenId

    const screenIndex = oldScreenIdToScreenIndex.get(gotoScreenId.toString())
    const newScreenId = newScreenIdByScreenIndex.get(screenIndex)

    return newScreenId || firstNewScreenId
  }

  const screenPromises = oldScreens.map((screen, index) => {
    return new Models.Screen({
      ...screen,
      _id: newScreenIds[index],
      storyId: newStoryId,
      workspaceId: workspaceId,
      userId: userId,
      steps: remapStepsGotoScreen(screen.steps, remapGotoScreen),
      customTransitions: remapTransitionsGotoScreen(screen.customTransitions, remapGotoScreen)
    }).save()
  })

  const savedScreens = await Promise.all(screenPromises)
  const screenIds = savedScreens.map(s => s._id)

  await new Models.Story({
    ...storyDoc,
    _id: newStoryId,
    userId: userId,
    workspaceId: workspaceId,
    screens: screenIds
  }).save()

  if (workspaceId) {
    await Models.Workspace.findByIdAndUpdate(workspaceId, {
      $push: { liveDemos: newStoryId }
    })
  }

  return newStoryId
}

export async function cloneUrlDemoWithStoryForUser(sourceUrlDemo, userId, workspaceId, browserSessionId, Models) {
  if (!sourceUrlDemo?.storyId) return null

  const newStoryId = await cloneStoryForUser(sourceUrlDemo.storyId, userId, workspaceId, Models)
  if (!newStoryId) return null

  return new Models.UrlDemo({
    url: sourceUrlDemo.url,
    browserSessionId: browserSessionId || sourceUrlDemo.browserSessionId,
    type: 'owned',
    storyId: newStoryId,
    status: 'completed',
    userId: userId,
  }).save()
}

/**
 * Finds all completed UrlDemos linked to browserSessionId that have no userId,
 * clones their storyDocs into the user's first workspace, and creates owned UrlDemos for the user.
 */
export async function cloneUrlDemoStoriesForUser(browserSessionId, userDoc, Models) {
  if (!browserSessionId || !userDoc) return

  const workspaceId = userDoc.workspaces?.[0]
  if (!workspaceId) return

  const urlDemos = await Models.UrlDemo.find({
    browserSessionId,
    status: 'completed',
    type: 'browsed',
    userId: { $exists: false },
    storyId: { $exists: true }
  }).lean()

  if (!urlDemos.length) return

  for (const urlDemo of urlDemos) {
    const clonedUrlDemo = await cloneUrlDemoWithStoryForUser(
      urlDemo,
      userDoc._id,
      workspaceId,
      urlDemo.browserSessionId,
      Models
    )

    if (clonedUrlDemo) {
      await Models.UrlDemo.updateOne(
        { _id: urlDemo._id },
        { $set: { storyId: clonedUrlDemo.storyId, userId: userDoc._id } }
      )
    }
  }
}
