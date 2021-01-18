import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../../util/appFactory.js'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'

const qs = require('query-string')

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ? (or AppCreateContentManager)
export class OpenCreateContentApp extends React.Component {
  openCreateContentApp = () => {
    const { workspaceId, user, contentType, renderAppPopupCreation, match, location, currentWorkspace } = this.props

    if (isNaN(workspaceId) || workspaceId === -1) return

    const contentInfomations = {
      ...contentType.find(ct => ct.slug === match.params.type),
      workspace: { label: currentWorkspace.label }
    }

    if (['idws', 'type'].every(p => p in match.params) && contentType.map(c => c.slug).includes(match.params.type)) {
      renderAppPopupCreation(
        contentInfomations,
        user,
        workspaceId,
        qs.parse(location.search).parent_id
      )
    }
  }

  componentDidMount () {
    console.log('%c<OpenCreateContentApp> did Mount', 'color: #dcae84', this.props)

    this.openCreateContentApp()
  }

  componentDidUpdate () {
    console.log('%c<OpenCreateContentApp> did Update', 'color: #dcae84', this.props)

    this.openCreateContentApp()
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ user, contentType, currentWorkspace }) => ({
  user,
  contentType: [
    ...contentType,
    // FIXME - CH - 2019-09-06 - hack for content type. See https://github.com/tracim/tracim/issues/2375
    HACK_COLLABORA_CONTENT_TYPE(contentType)
  ],
  currentWorkspace
})
export default withRouter(connect(mapStateToProps)(appFactory(OpenCreateContentApp)))
