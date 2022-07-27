import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

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
  PAGE,
  TextInput,
  htmlToText
} from 'tracim_frontend_lib'

import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle,
  setWorkspaceSubscriptionList
} from '../action-creator.sync.js'
import { getWorkspaceSubscriptions, postUserWorkspace, putUserWorkspaceSubscription } from '../action-creator.async.js'

export class JoinWorkspace extends React.Component {
  constructor (props) {
    super(props)

    this.state = { filter: '' }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  async componentDidMount () {
    const { props } = this
    this.handleAllAppChangeLanguage()
    await this.loadWorkspaceSubscriptions()
    if (props.history.location.state && props.history.location.state.fromSearch) {
      this.setState({ filter: props.spaceSearch.searchString })
    }
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

  handleAllAppChangeLanguage = () => {
    const { props } = this
    this.buildBreadcrumbs()
    props.dispatch(setHeadTitle(props.t('Join a space')))
  }

  buildBreadcrumbs () {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.JOIN_WORKSPACE,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Join a space'),
      isALink: true
    }]))
  }

  async joinWorkspace (workspace) {
    const { props } = this

    const fetchPutUserSpaceSubscription = await props.dispatch(postUserWorkspace(workspace.id, props.user.userId))

    switch (fetchPutUserSpaceSubscription.status) {
      case 200:
        props.dispatch(newFlashMessage(props.t(
          'You joined the space {{space}}',
          { space: workspace.label }
        ), 'info'))
        props.history.push(PAGE.WORKSPACE.DASHBOARD(workspace.id))
        break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
    }
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
      return <div><i className={`fas fa-${icon}`} /> {text}</div>
    }

    switch (workspace.accessType) {
      case SPACE_TYPE.onRequest.slug:
        return (
          <IconButton
            icon='fas fa-share'
            text={props.t('Request access')}
            onClick={() => this.handleClickRequestAccess(workspace, props.user.userId)}
          />)
      case SPACE_TYPE.open.slug:
        return (
          <IconButton
            icon='fas fa-sign-in-alt'
            text={props.t('Join the space')}
            onClick={() => this.joinWorkspace(workspace)}
          />)
      default:
        return <span>{props.t('Unknown space type')}</span>
    }
  }

  createIconForAccessType (accessType) {
    const spaceType = SPACE_TYPE_LIST.find(t => t.slug === accessType)
    return spaceType
      ? <i className={`fas fa-fw fa-2x ${spaceType.faIcon}`} title={this.props.t(spaceType.tradKey[0])} />
      : <i className='fas fa-fw fa-2x fa-search' title={this.props.t('Unknown space type')} />
    // RJ - 2020-10-30 - NOTE
    // This code uses props.t on a key that is translated in frontend_lib (spaceType.tradKey[0]).
    // This works because translations are grouped during compilation.
    // This may break in the future but there is a Cypress test to catch this
  }

  handleWorkspaceFilter (filter) {
    this.setState({ filter: filter.toLowerCase() })
  }

  async handleClickRequestAccess (space, userId) {
    const { props } = this
    const fetchPutUserSpaceSubscription = await props.dispatch(putUserWorkspaceSubscription(space.id, userId))

    switch (fetchPutUserSpaceSubscription.status) {
      case 200:
        props.dispatch(newFlashMessage(props.t(
          'Your request to join {{space}} will be handled by a space manager. The result will be shown on the notification wall.',
          { space: space.label }
        ), 'info'))
        break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
    }
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
    const parser = new DOMParser()
    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass={`${className}__wrapper`}>
            <PageTitle
              parentClass={className}
              title={props.t('Join a space')}
              icon='fas fa-users'
              breadcrumbsList={props.breadcrumbs}
              isEmailNotifActivated={props.system.config.email_notification_activated}
            />

            <PageContent parentClass={`${className}__content`}>
              <TextInput
                customClass={`${className}__content__filter form-control`}
                onChange={e => this.handleWorkspaceFilter(e.target.value)}
                placeholder={props.t('Filter spaces')}
                icon='search'
                value={this.state.filter}
              />
              <div className={`${className}__content__workspaceList`} data-cy='joinWorkspaceWorkspaceList'>
                <div className={`${className}__content__workspaceList__item`}>
                  <b>{props.t('Type')}</b>
                  <b>{props.t('Title and description')}</b>
                  <b>{props.t('Access request')}</b>
                </div>

                {props.accessibleWorkspaceList.filter(this.filterWorkspaces.bind(this)).map((workspace) => {
                  const descriptionText = htmlToText(parser, workspace.description)
                  return (
                    <div key={workspace.id} className={`${className}__content__workspaceList__item`}>
                      {this.createIconForAccessType(workspace.accessType)}
                      <div className={`${className}__content__workspaceList__item__title_description`}>
                        <span>{workspace.label}</span>
                        <span
                          className={`${className}__content__workspaceList__item__description`}
                          title={descriptionText}
                        >
                          {descriptionText}
                        </span>
                      </div>
                      {this.createRequestComponent(workspace)}
                    </div>
                  )
                })}
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ accessibleWorkspaceList, breadcrumbs, spaceSearch, system, user, workspaceSubscriptionList }) => ({
  accessibleWorkspaceList,
  breadcrumbs,
  spaceSearch,
  system,
  user,
  workspaceSubscriptionList
})
export default connect(mapStateToProps)(translate()(TracimComponent(JoinWorkspace)))
