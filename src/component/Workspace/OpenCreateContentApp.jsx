import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../appFactory.js'

const qs = require('query-string')

export class OpenCreateContentApp extends React.Component {
  openCreateContentApp = () => {
    const { idWorkspace, appOpenedType, user, contentType, renderCreateContentApp, match, location } = this.props

    if (isNaN(idWorkspace) || idWorkspace === -1) return

    if (['idws', 'type'].every(p => p in match.params) && contentType.map(c => c.slug).includes(match.params.type)) {
      renderCreateContentApp(
        contentType.find(ct => ct.slug === match.params.type),
        user,
        idWorkspace,
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

const mapStateToProps = ({ user, workspaceContent, contentType }) => ({ user, workspaceContent, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(OpenCreateContentApp)))
