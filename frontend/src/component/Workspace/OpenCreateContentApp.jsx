import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../appFactory.js'

const qs = require('query-string')

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ? (or AppCreateContentManager)
export class OpenCreateContentApp extends React.Component {
  openCreateContentApp = () => {
    const { workspaceId, user, contentType, renderAppPopupCreation, match, location, customFormContentType } = this.props

    if (isNaN(workspaceId) || workspaceId === -1) return

    if (['idws', 'type'].every(p => p in match.params) && contentType.map(c => c.slug).includes(match.params.type)) {
      renderAppPopupCreation(
        contentType.find(ct => ct.slug === match.params.type),
        user,
        workspaceId,
        qs.parse(location.search).parent_id
      )
    } else if (['idws', 'slugForm'].every(p => p in match.params) && customFormContentType.map(c => c.slugForm).includes(match.params.slugForm)) {
      renderAppPopupCreation(
        customFormContentType.find(ct => ct.slugForm === match.params.slugForm),
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

const mapStateToProps = ({ user, contentType, customFormContentType }) => ({ user, contentType, customFormContentType })
export default withRouter(connect(mapStateToProps)(appFactory(OpenCreateContentApp)))
