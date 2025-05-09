import { CUSTOM_EVENT } from 'tracim_frontend_lib'

let previouslySelectedAppFeatureSlug = ''
let previouslySelectedAppFullScreenSlug = ''
const APP_NOT_LOADED = 'appNotLoaded'
const TIME_TO_RETRY = 500
const RETRY_TIMEOUT = 60000

const getSelectedApp = async function (appName) {
  // FIXME - CH - 2019-06-18 - The try/catch is a temporary solution to solve the frontend, apps and appInterface.js
  // loading and execution order. If getSelectedApp return APP_NOT_LOADED, GLOBAL_renderAppFeature and GLOBAL_renderAppFullscreen
  // will retry every TIME_TO_RETRY ms for RETRY_TIMEOUT ms
  // see https://github.com/tracim/tracim/issues/1954

  /*
    global appHtmlDocument, appThread, appFile, appFolderAdvanced, appAdminWorkspaceUser, appWorkspaceAdvanced,
    appAgenda, appShareFolderAdvanced, appCollaborativeDocumentEdition, appGallery, appWorkspace, appKanban, appLogbook
  */
  try {
    switch (appName) {
      case 'html-document':
        return (appHtmlDocument || { default: {} }).default
      case 'thread':
        return (appThread || { default: {} }).default
      case 'file':
        if (!appFile) return {}
        return (await appFile).default
      case 'workspace':
        return (appWorkspace || { default: {} }).default
      case 'folder':
        return (appFolderAdvanced || { default: {} }).default
      case 'admin_workspace_user':
        return (appAdminWorkspaceUser || { default: {} }).default
      case 'workspace_advanced':
        return (appWorkspaceAdvanced || { default: {} }).default
      case 'agenda':
        return (appAgenda || { default: {} }).default
      case 'share_folder':
        return (appShareFolderAdvanced || { default: {} }).default
      case 'collaborative_document_edition':
        return (appCollaborativeDocumentEdition || { default: {} }).default
      case 'gallery':
        return (appGallery || { default: {} }).default
      case 'kanban':
        return (appKanban || { default: {} }).default
      case 'logbook':
        return (appLogbook || { default: {} }).default
      default:
        return APP_NOT_LOADED
    }
  } catch (e) {
    return APP_NOT_LOADED
  }
}

globalThis.GLOBAL_renderAppFeature = async function (app, retryCount) {
  console.log('%cGLOBAL_renderAppFeature', 'color: #5cebeb', app)

  const selectedApp = await getSelectedApp(app.config.slug)

  if (selectedApp && selectedApp.content && app && app.content && selectedApp.content.workspace_id !== app.content.workspace_id) {
    unMountApp()
  }

  if (selectedApp === APP_NOT_LOADED) {
    retryCount = retryCount || 0 // INFO - CH - 2019-06-18 - old school way for default param

    console.log(app.config.slug + ' does not exist. Maybe it hasn\'t finished loading yet? Retrying in ' + TIME_TO_RETRY + 'ms')
    const retryTime = retryCount + TIME_TO_RETRY

    if (retryTime < RETRY_TIMEOUT) {
      setTimeout(() => globalThis.GLOBAL_renderAppFeature(app, retryTime), TIME_TO_RETRY)
      return
    }

    console.error('Timed out waiting for app ' + app.config.slug + ' to exist')
    return
  }

  if (selectedApp.isRendered) {
    globalThis.GLOBAL_dispatchEvent({ type: app.config.slug + '_showApp', data: app })
  } else {
    if (previouslySelectedAppFeatureSlug !== selectedApp.name) {
      globalThis.GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.UNMOUNT_APP_FEATURE, data: {} })
      unMountAppFeature()
    }

    selectedApp.renderAppFeature(app)
    selectedApp.isRendered = true

    const previouslySelectedAppFeature = await getSelectedApp(previouslySelectedAppFeatureSlug)
    if (previouslySelectedAppFeature !== APP_NOT_LOADED) {
      previouslySelectedAppFeature.isRendered = false
    }
    previouslySelectedAppFeatureSlug = selectedApp.name
  }
}

globalThis.GLOBAL_renderAppFullscreen = async function (app, retryCount) {
  console.log('%cGLOBAL_renderAppFullscreen', 'color: #5cebeb', app)

  const selectedApp = await getSelectedApp(app.config.slug)

  if (selectedApp === APP_NOT_LOADED) {
    retryCount = retryCount || 0 // INFO - CH - 2019-06-18 - old school way for default param

    console.log(app.config.slug + ' does not exist. Maybe it hasn\'t finished loading yet? Retrying in ' + TIME_TO_RETRY + 'ms')
    const retryTime = retryCount + TIME_TO_RETRY

    if (retryTime < RETRY_TIMEOUT) {
      setTimeout(() => globalThis.GLOBAL_renderAppFullscreen(app, retryTime), TIME_TO_RETRY)
      return
    }

    console.error('Timed out waiting for app ' + app.config.slug + ' to exist')
    return
  }

  if (selectedApp.isRendered) {
    globalThis.GLOBAL_dispatchEvent({ type: app.config.slug + '_showApp', data: app })
  } else {
    selectedApp.renderAppFullscreen(app)
    selectedApp.isRendered = true

    const previouslySelectedAppFullScreen = await getSelectedApp(previouslySelectedAppFullScreenSlug)
    if (previouslySelectedAppFullScreen !== APP_NOT_LOADED) {
      previouslySelectedAppFullScreen.isRendered = false
    }
    previouslySelectedAppFullScreenSlug = selectedApp.name
  }
}

globalThis.GLOBAL_renderAppPopupCreation = async function (app, retryCount) {
  console.log('%cGLOBAL_renderAppPopupCreation', 'color: #5cebeb', app)

  const selectedApp = await getSelectedApp(app.config.slug)

  if (selectedApp === APP_NOT_LOADED) {
    retryCount = retryCount || 0 // INFO - CH - 2019-06-18 - old school way for default param

    console.log(app.config.slug + ' does not exist. Maybe it hasn\'t finished loading yet? Retrying in ' + TIME_TO_RETRY + 'ms')
    const retryTime = retryCount + TIME_TO_RETRY

    if (retryTime < RETRY_TIMEOUT) {
      setTimeout(() => GLOBAL_renderAppPopupCreation(app, retryTime), TIME_TO_RETRY)
      return
    }

    console.error('Timed out waiting for app ' + app.config.slug + ' to exist')
    return
  }

  selectedApp.renderAppPopupCreation(app)
}

globalThis.GLOBAL_dispatchEvent = function (event) {
  const type = event.type
  const data = event.data
  console.log('%cGLOBAL_dispatchEvent', 'color: #fff', type, data)

  const customEvent = new globalThis.CustomEvent(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, { detail: { type, data } })
  document.dispatchEvent(customEvent)
}

async function unMountAppFeature () {
  if (previouslySelectedAppFeatureSlug !== '') {
    const selectedApp = await getSelectedApp(previouslySelectedAppFeatureSlug)
    selectedApp.unmountApp('appFeatureContainer')
    selectedApp.unmountApp('popupCreateContentContainer')
    selectedApp.isRendered = false
    previouslySelectedAppFeatureSlug = ''
  }
}

async function unMountAppFullscreen () {
  if (previouslySelectedAppFullScreenSlug !== '') {
    const selectedApp = await getSelectedApp(previouslySelectedAppFullScreenSlug)
    selectedApp.unmountApp('appFullscreenContainer')
    selectedApp.isRendered = false
    previouslySelectedAppFullScreenSlug = ''
  }
}

function unMountApp () {
  unMountAppFeature()
  unMountAppFullscreen()
}

const eventReducer = async function (event) {
  const type = event.detail.type
  const data = event.detail.data

  switch (type) {
    case CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT:
    case CUSTOM_EVENT.HIDE_POPUP_CREATE_WORKSPACE:
      console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)
      ;(await getSelectedApp(data.name)).unmountApp('popupCreateContentContainer')
      break
    case CUSTOM_EVENT.UNMOUNT_APP:
      console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)
      unMountApp()
      break
    case CUSTOM_EVENT.UNMOUNT_APP_FEATURE:
      console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)
      break
  }
}

document.addEventListener('appCustomEventListener', eventReducer)
