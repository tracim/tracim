(function () {
  let prevSelectedAppFeature = ''
  let prevSelectedAppFullScreen = ''

  getSelectedApp = name => {
    switch (name) {
      case 'html-document':
        return (appHtmlDocument || {default: {}}).default
      case 'thread':
        return (appThread || {default: {}}).default
      case 'file':
        return (appFile || {default: {}}).default
      case 'workspace':
        return (appWorkspace || {default: {}}).default
      case 'folder':
        return (appFolderAdvanced || {default: {}}).default
      case 'admin_workspace_user':
        return (appAdminWorkspaceUser || {default: {}}).default
      case 'workspace_advanced':
        return (appWorkspaceAdvanced || {default: {}}).default
      case 'agenda':
        return (appAgenda || {default: {}}).default
      default:
        return null
    }
  }

  //@TODO make a file action.tracimCustomEvent.js that will contains all customEvent that tracim_frontend call
  // => pb with that is that appInterface cant use import since it is not part of the build webpack
  // use module.export and require
  // doesn't work, cant resolve a file outside of the build dir

  GLOBAL_renderAppFeature = app => {
    console.log('%cGLOBAL_renderAppFeature', 'color: #5cebeb', app)

    const selectedApp = getSelectedApp(app.config.slug)

    if (selectedApp.isRendered) {
      GLOBAL_dispatchEvent({type: `${app.config.slug}_showApp`, data: app})
    } else {
      selectedApp.renderAppFeature(app)
      selectedApp.isRendered = true
      ;(getSelectedApp(prevSelectedAppFeature) || {isRendered: null}).isRendered = false
      prevSelectedAppFeature = selectedApp.name
    }
  }

  GLOBAL_renderAppFullscreen = app => {
    console.log('%cGLOBAL_renderAppFullscreen', 'color: #5cebeb', app)

    const selectedApp = getSelectedApp(app.config.slug)

    if (selectedApp.isRendered) {
      GLOBAL_dispatchEvent({type: `${app.config.slug}_showApp`, data: app})
    } else {
      selectedApp.renderAppFullscreen(app)
      selectedApp.isRendered = true
      ;(getSelectedApp(prevSelectedAppFullScreen) || {isRendered: null}).isRendered = false
      prevSelectedAppFullScreen = selectedApp.name
    }
  }

  GLOBAL_renderAppPopupCreation = app => {
    console.log('%cGLOBAL_renderAppPopupCreation', 'color: #5cebeb', app)

    const selectedApp = getSelectedApp(app.config.slug)

    if (!selectedApp) {
      console.log('Error in GLOBAL_renderAppPopupCreation, selectedApp is undefined', app)
      return
    }

    getSelectedApp(app.config.slug).renderAppPopupCreation(app)
  }

  GLOBAL_dispatchEvent = ({type, data}) => {
    console.log('%cGLOBAL_dispatchEvent', 'color: #fff', type, data)

    const event = new CustomEvent('appCustomEvent', {detail: {type, data}})
    document.dispatchEvent(event)
  }

  GLOBAL_eventReducer = ({detail: {type, data}}) => {
    switch (type) {
      case 'hide_popupCreateContent':
      case 'hide_popupCreateWorkspace':
        console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)
        getSelectedApp(data.name).unmountApp('popupCreateContentContainer')
        break
      case 'unmount_app':
        console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)

        if (prevSelectedAppFeature !== '') {
          const selectedApp = getSelectedApp(prevSelectedAppFeature)
          selectedApp.unmountApp('appFeatureContainer')
          selectedApp.unmountApp('popupCreateContentContainer')
          selectedApp.isRendered = false
          prevSelectedAppFeature = ''
        }

        if (prevSelectedAppFullScreen !== '') {
          const selectedApp = getSelectedApp(prevSelectedAppFullScreen)
          selectedApp.unmountApp('appFullscreenContainer')
          selectedApp.isRendered = false
          prevSelectedAppFullScreen = ''
        }
        break
    }
  }

  document.addEventListener('appCustomEvent', GLOBAL_eventReducer)
})()
