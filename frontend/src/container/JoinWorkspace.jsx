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
  IconButton,
  TextInput
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
import { getWorkspaceSubscriptions, postUserWorkspace, putUserWorkspaceSubscription } from '../action-creator.async.js'

require('../css/JoinWorkspace.styl')

export class JoinWorkspace extends React.Component {
  constructor (props) {
    super(props)

    this.state = { filter: '' }

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
    await props.dispatch(postUserWorkspace(workspaceId, props.user.userId))
    props.history.push(PAGE.WORKSPACE.DASHBOARD(workspaceId))
  }

  createRequestComponent (workspace) {
    const { props } = this

    const subscription = props.workspaceSubscriptionList.find(s => s.workspace.workspace_id === workspace.id)

    if (subscription !== undefined && subscription.state !== SUBSCRIPTION_TYPE.rejected.slug) {
      let text = 'Unknown request state'
      let icon = 'question'
      switch (subscription.state) {
        case SUBSCRIPTION_TYPE.pending.slug:
          text = props.t('Request sent')
          icon = SUBSCRIPTION_TYPE.pending.faIcon
          break
        case SUBSCRIPTION_TYPE.accepted.slug:
          text = props.t('Request accepted')
          icon = SUBSCRIPTION_TYPE.pending.faIcon
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
            onClick={() => props.dispatch(putUserWorkspaceSubscription(workspace.id, props.user.userId))}
          />)
      case SPACE_TYPE.open.slug:
        return (
          <IconButton
            icon='sign-in'
            text={props.t('Join the space')}
            onClick={() => this.joinWorkspace(workspace.id)}
          />)
      default:
        return <span>Unknown space access type</span>
    }
  }

  createIconForAccessType (accessType) {
    const spaceType = SPACE_TYPE_LIST.find(t => t.slug === accessType)
    return spaceType
      ? <i class={`fa fa-fw fa-2x fa-${spaceType.faIcon}`} title={spaceType.label} />
      : <i class='fa fa-fw fa-2x fa-search' title='Unknown space type' />
  }

  handleWorkspaceFilter (filter) {
    this.setState({ filter: filter.toLowerCase() })
  }

  filterWorkspaces (workspace) {
    return (
      workspace.label.toLowerCase().includes(this.state.filter) ||
      workspace.description.toLowerCase().includes(this.state.filter)
    )
  }

  render () {
    const { props } = this
    const className = 'joinWorkspace'
    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass={`${className}__wrapper`}>
            <PageTitle
              parentClass={className}
              title={props.t('Join a space')}
              icon='users'
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass={`${className}__content`}>
              <TextInput
                customClass={`${className}__content__filter form-control`}
                onChange={e => this.handleWorkspaceFilter(e.target.value)}
                placeholder={props.t('Filter spaces')}
                icon='search'
              />
              <div className={`${className}__content__workspaceList`} data-cy='joinWorkspaceWorkspaceList'>
                <div className={`${className}__content__workspaceList__item`}>
                  <b>{props.t('Type')}</b>
                  <b>{props.t('Title and description')}</b>
                  <b>{props.t('Access request')}</b>
                </div>
                {props.accessibleWorkspaceList.filter(this.filterWorkspaces.bind(this)).map((workspace) =>
                  <div key={workspace.id} className={`${className}__content__workspaceList__item`}>
                    {this.createIconForAccessType(workspace.accessType)}
                    <div class={`${className}__content__workspaceList__item__title_description`}>
                      <span>{workspace.label}</span>
                      <span
                        className={`${className}__content__workspaceList__item__description`}
                        title={workspace.description}
                      >
                        {workspace.description}
                      </span>
                    </div>
                    {this.createRequestComponent(workspace)}
                  </div>
                )}
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, accessibleWorkspaceList, workspaceSubscriptionList }) => ({ breadcrumbs, user, accessibleWorkspaceList, workspaceSubscriptionList })
export default connect(mapStateToProps)(translate()(TracimComponent(JoinWorkspace)))
