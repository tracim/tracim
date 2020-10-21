import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  PageWrapper,
  PageTitle,
  PageContent,
  CUSTOM_EVENT,
  BREADCRUMBS_TYPE,
  TracimComponent,
  SPACE_TYPE,
  SPACE_TYPE_LIST,
  SUBSCRIPTION_TYPE,
  IconButton
} from 'tracim_frontend_lib'

import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle,
  setWorkspaceSubscriptionList
} from '../action-creator.sync.js'
import {
  PAGE
} from '../util/helper.js'
import { getWorkspaceSubscriptions, joinWorkspace, subscribeToWorkspace } from '../action-creator.async.js'

export class JoinWorkspace extends React.Component {
  constructor (props) {
    super(props)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  async componentDidMount () {
    this.handleAllAppChangeLanguage()
    await this.loadWorkspaceSubscriptions()
  }

  async loadWorkspaceSubscriptions () {
    const { props } = this

    const fetchSubscriptionList = await props.dispatch(getWorkspaceSubscriptions(props.user.userId))

    if (fetchSubscriptionList.status !== 200) {
      props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
      return
    }
    props.dispatch(setWorkspaceSubscriptionList(fetchSubscriptionList.json))
  }

  handleAllAppChangeLanguage () {
    const { props } = this
    this.buildBreadcrumbs()
    props.dispatch(setHeadTitle(props.t('Join a space')))
  }

  buildBreadcrumbs () {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <Link to={PAGE.JOIN_WORKSPACE}>{props.t('Join a space')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }]))
  }

  async joinWorkspace (workspaceId) {
    const { props } = this
    await props.dispatch(joinWorkspace(workspaceId, props.user.userId))
    props.history.push(PAGE.WORKSPACE.DASHBOARD(workspaceId))
  }

  createRequestComponent (workspace) {
    const { props } = this

    const subscription = props.workspaceSubscriptionList.find(s => s.workspace.workspace_id === workspace.id)

    if (subscription !== undefined) {
      var text = 'Unknown request state'
      var icon = 'question'
      switch (subscription.state) {
        case SUBSCRIPTION_TYPE.pending.slug:
          text = props.t('Request sent')
          icon = SUBSCRIPTION_TYPE.pending.faIcon
          break
        case SUBSCRIPTION_TYPE.rejected.slug:
          text = props.t('Request rejected')
          icon = SUBSCRIPTION_TYPE.rejected.faIcon
          break
      }
      return <div><i class={`fa fa-${icon}`} /> {text}</div>
    }

    switch (workspace.accessType) {
      case SPACE_TYPE.onRequest.slug:
        return (
          <IconButton
            icon='share'
            text={props.t('Request access')}
            onClick={() => props.dispatch(subscribeToWorkspace(workspace.workspace_id, props.user.userId))}
          />)
      case SPACE_TYPE.open.slug:
        return (
          <IconButton
            icon='sign-in'
            text={props.t('Join the space')}
            onClick={() => this.joinWorkspace(workspace.workspace_id)}
          />)
      default:
        return 'Unknown space access type'
    }
  }

  getFaIconForAccessType (accessType) {
    const spaceType = SPACE_TYPE_LIST.find(t => t.slug === accessType)
    return spaceType ? spaceType.faIcon : 'question'
  }

  render () {
    const { props } = this
    const className = 'joinWorkspace'
    return (
      <PageWrapper customClass={className}>
        <PageTitle
          parentClass={className}
          title={props.t('Join a space')}
          icon='users'
          breadcrumbsList={props.breadcrumbs}
        />

        <PageContent parentClass={className}>
          <div>
            <div><span>{props.t('Type')}</span><span>{props.t('Title and description')}</span><span>{props.t('Access request')}</span></div>
            {props.accessibleWorkspaceList.map(workspace => (
              <div key={workspace.id}>
                <i class={`fa fa-${this.getFaIconForAccessType(workspace.accessType)}`} />
                <div><span>{workspace.label}</span><span>{workspace.description}</span></div>
                {this.createRequestComponent(workspace)}
              </div>
            ))}
          </div>
        </PageContent>
      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, accessibleWorkspaceList, workspaceSubscriptionList }) => ({ breadcrumbs, user, accessibleWorkspaceList, workspaceSubscriptionList })
export default connect(mapStateToProps)(translate()(TracimComponent(JoinWorkspace)))
