(function () {
  let prevSelectedAppFeature = {name: ''}
  let prevSelectedAppFullScreen = {name: ''}

  getSelectedApp = name => {
    switch (name) {
      case 'workspace':
        return appWorkspace
      case 'html-document':
        return appHtmlDocument
      case 'thread':
        return appThread
      case 'file':
        return appFile
      case 'admin_workspace_user':
        return appAdminWorkspaceUser
      case 'workspace_advanced':
        return appWorkspaceAdvanced
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
      GLOBAL_dispatchEvent({type: `${app.config.slug}_showApp`, data: app}) // handled by html-documents:src/container/AdminWorkspaceUser.jsx
    } else {
      selectedApp.renderAppFeature(app)
      selectedApp.isRendered = true
      prevSelectedAppFeature.isRendered = false
      prevSelectedAppFeature = selectedApp
    }
  }

  GLOBAL_renderAppFullscreen = app => {
    console.log('%cGLOBAL_renderAppFullscreen', 'color: #5cebeb', app)

    const selectedApp = getSelectedApp(app.config.slug)

    if (selectedApp.isRendered) {
      GLOBAL_dispatchEvent({type: `${app.config.slug}_showApp`, data: app}) // handled by html-documents:src/container/AdminWorkspaceUser.jsx
    } else {
      selectedApp.renderAppFullscreen(app)
      selectedApp.isRendered = true
      prevSelectedAppFullScreen.isRendered = false
      prevSelectedAppFullScreen = selectedApp
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

        if (prevSelectedAppFeature.name !== '') {
          prevSelectedAppFeature.unmountApp('appFeatureContainer')
          prevSelectedAppFeature.unmountApp('popupCreateContentContainer')
          prevSelectedAppFeature.isRendered = false
        }

        if (prevSelectedAppFullScreen.name !== '') {
          prevSelectedAppFullScreen.unmountApp('appFullscreenContainer')
          prevSelectedAppFullScreen.isRendered = false
        }
        break
    }
  }

  document.addEventListener('appCustomEvent', GLOBAL_eventReducer)
})()
