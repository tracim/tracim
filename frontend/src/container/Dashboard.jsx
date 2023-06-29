import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { withRouter } from 'react-router-dom'
import {
  BREADCRUMBS_TYPE,
  COLORS,
  CUSTOM_EVENT,
  PAGE,
  PROFILE,
  ROLE,
  ROLE_LIST,
  SPACE_TYPE,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  IconButton,
  Loading,
  PageContent,
  PageWrapper,
  TracimComponent,
  buildHeadTitle,
  removeAtInUsername,
  addExternalLinksIcons
} from 'tracim_frontend_lib'
import {
  getMyselfKnownMember,
  getSubscriptions,
  postWorkspaceMember,
  deleteWorkspaceMember,
  putMyselfWorkspaceEmailNotificationType
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import appFactory from '../util/appFactory.js'
import {
  FETCH_CONFIG,
  findUserRoleIdInWorkspace
} from '../util/helper.js'
import UserStatus from '../component/Dashboard/UserStatus.jsx'
import ContentTypeBtn from '../component/Dashboard/ContentTypeBtn.jsx'
import MemberList from '../component/Dashboard/MemberList.jsx'
import TabBar from '../component/TabBar/TabBar.jsx'
import WorkspaceRecentActivities from './WorkspaceRecentActivities.jsx'
import { HACK_COLLABORA_CONTENT_TYPE } from './WorkspaceContent.jsx'

const ALWAYS_ALLOWED_BUTTON_SLUGS = ['contents/all', 'agenda', 'gallery']

export class Dashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      advancedDashboardOpenedId: null,
      newMember: {
        id: '',
        avatarUrl: '',
        personalData: '',
        publicName: '',
        role: props.currentWorkspace.defaultRole,
        isEmail: false
      },
      isMemberListLoading: false,
      displayNewMemberForm: false,
      autoCompleteFormNewMemberActive: false,
      searchedKnownMemberList: [],
      autoCompleteClicked: false,
      displayNotifBtn: false,
      displayWebdavBtn: false,
      newSubscriptionRequestsNumber: 0
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.CREATED, handler: this.handleNewSubscriptionRequest },
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.MODIFIED, handler: this.handleSubscriptionRequestModified }
    ])
  }

  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  handleWorkspaceModified = data => {
    if (this.props.currentWorkspace.id !== data.fields.workspace.workspace_id) return
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  async componentDidMount () {
    this.setHeadTitle()
    this.loadNewRequestNumber()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps) {
    const { props } = this

    // INFO - CH - 2022 06 16 - empty string is the default value for the property currentWorkspace.defaultRole in the reducer
    if (prevProps.currentWorkspace.defaultRole === '' && props.currentWorkspace.defaultRole !== '') {
      this.setState(prev => ({ newMember: { ...prev.newMember, role: props.currentWorkspace.defaultRole } }))
    }

    if (prevProps.currentWorkspace.defaultRole !== '' && props.currentWorkspace.defaultRole === '') {
      this.setState(prev => ({ newMember: { ...prev.newMember, role: props.currentWorkspace.defaultRole } }))
    }

    if (!prevProps.match || !props.match || prevProps.currentWorkspace.id === props.currentWorkspace.id) return
    if (prevProps.system.config.instance_name !== props.system.config.instance_name) this.setHeadTitle()

    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP) // to unmount advanced workspace
    this.setState({
      advancedDashboardOpenedId: null,
      displayNewMemberForm: false,
      newMember: {
        id: '',
        avatarUrl: '',
        personalData: '',
        publicName: '',
        role: props.currentWorkspace.defaultRole,
        isEmail: false
      }
    })
    this.loadNewRequestNumber()
    this.buildBreadcrumbs()
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP) // to unmount advanced workspace
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  loadNewRequestNumber = async () => {
    const { props } = this

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, props.currentWorkspace.memberList, ROLE_LIST)
    if (userRoleIdInWorkspace < ROLE.workspaceManager.id) return

    const fetchGetWorkspaceSubscriptions = await props.dispatch(getSubscriptions(props.currentWorkspace.id))
    switch (fetchGetWorkspaceSubscriptions.status) {
      case 200: {
        const filteredSubscriptionRequestList = fetchGetWorkspaceSubscriptions.json.filter(subscription => subscription.state === 'pending')
        this.setState({ newSubscriptionRequestsNumber: filteredSubscriptionRequestList.length })
        break
      }
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('new requests')}`, 'warning')); break
    }
  }

  handleNewSubscriptionRequest = (data) => {
    if (data.fields.workspace.workspace_id !== this.props.currentWorkspace.id) return
    this.setState(prev => ({ newSubscriptionRequestsNumber: prev.newSubscriptionRequestsNumber + 1 }))
  }

  handleSubscriptionRequestModified = (data) => {
    if (data.fields.workspace.workspace_id !== this.props.currentWorkspace.id) return
    data.fields.subscription.state === 'pending'
      ? this.setState(prev => ({ newSubscriptionRequestsNumber: prev.newSubscriptionRequestsNumber + 1 }))
      : this.setState(prev => ({ newSubscriptionRequestsNumber: prev.newSubscriptionRequestsNumber - 1 }))
  }

  setHeadTitle = () => {
    const { props } = this

    const headTitle = buildHeadTitle(
      [props.t('Dashboard'), props.currentWorkspace.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    const breadcrumbsList = [{
      link: PAGE.WORKSPACE.DASHBOARD(props.currentWorkspace.id),
      type: BREADCRUMBS_TYPE.CORE,
      label: props.currentWorkspace.label,
      isALink: true
    }, {
      link: '',
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Dashboard'),
      isALink: false
    }]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  handleClickAddMemberBtn = () => this.setState({ displayNewMemberForm: true })

  handleClickCloseAddMemberBtn = () => this.setState({ displayNewMemberForm: false })

  handleToggleWebdavBtn = () => this.setState(prevState => ({ displayWebdavBtn: !prevState.displayWebdavBtn }))

  handleSearchUser = async personalDataToSearch => {
    const { props } = this
    const fetchUserKnownMemberList = await props.dispatch(getMyselfKnownMember(personalDataToSearch, props.currentWorkspace.id))
    switch (fetchUserKnownMemberList.status) {
      case 200: this.setState({ searchedKnownMemberList: fetchUserKnownMemberList.json }); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('known members list')}`, 'warning')); break
    }
  }

  isEmail = string => /\S*@\S*\.\S{2,}/.test(string)

  handleChangePersonalData = async newPersonalData => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        personalData: newPersonalData,
        publicName: newPersonalData,
        isEmail: this.isEmail(newPersonalData)
      },
      autoCompleteClicked: false
    }))

    const personalData = removeAtInUsername(newPersonalData)

    if (personalData.length >= 2) {
      await this.handleSearchUser(personalData)
      this.setState({ autoCompleteFormNewMemberActive: true })
    }
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        publicName: knownMember.public_name,
        personalData: knownMember.username,
        avatarUrl: knownMember.avatar_url,
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      autoCompleteClicked: true
    }))
  }

  handleClickAutoComplete = () => this.setState({
    autoCompleteFormNewMemberActive: false,
    autoCompleteClicked: true
  })

  handleChangeNewMemberRole = newRole => this.setState(prev => ({ newMember: { ...prev.newMember, role: newRole } }))

  handleClickValidateNewMember = async () => {
    const { props, state } = this

    if (state.newMember.personalData === '') {
      props.dispatch(newFlashMessage(props.t('Please set a name, an email or a username'), 'warning'))
      return false
    }

    if (state.newMember.role === '') {
      props.dispatch(newFlashMessage(props.t('Please set a role'), 'warning'))
      return false
    }

    this.setState({ isMemberListLoading: true })

    const newMemberInKnownMemberList = state.searchedKnownMemberList.find(u => u.user_id === state.newMember.id)

    if (state.newMember.id === '' && newMemberInKnownMemberList) { // this is to force sending the id of the user to the api if he exists
      this.setState({ newMember: { ...state.newMember, id: newMemberInKnownMemberList.user_id } })
    }

    const fetchWorkspaceNewMember = await props.dispatch(postWorkspaceMember(props.currentWorkspace.id, {
      id: state.newMember.id || newMemberInKnownMemberList ? newMemberInKnownMemberList.user_id : null,
      email: state.newMember.isEmail ? state.newMember.personalData.trim() : '',
      username: state.newMember.isEmail ? '' : state.newMember.personalData,
      role: state.newMember.role
    }))

    this.setState({
      newMember: {
        id: '',
        avatarUrl: '',
        personalData: '',
        publicName: '',
        role: props.currentWorkspace.defaultRole,
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      displayNewMemberForm: false
    })

    this.setState({ isMemberListLoading: false })

    switch (fetchWorkspaceNewMember.status) {
      case 200:
        props.dispatch(newFlashMessage(props.t('Member added'), 'info'))
        return true
      case 400:
        switch (fetchWorkspaceNewMember.json.code) {
          case 2042:
            props.dispatch(newFlashMessage(props.t('This account is deactivated'), 'warning'))
            return false
          case 1001: {
            const ErrorMsg = () => (
              <div>
                {props.t('Unknown user')}<br />
                {props.t('Note, only administrators can send invitational email')}
              </div>
            )
            props.dispatch(newFlashMessage(<ErrorMsg />))
            return false
          }
          case 3008:
            props.dispatch(newFlashMessage(props.t('This user already is in the space'), 'warning'))
            return false
          default:
            props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
            return false
        }
      default:
        props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
        return false
    }
  }

  handleClickRemoveMember = async memberId => {
    const { props } = this

    this.setState({ isMemberListLoading: true })

    const fetchWorkspaceRemoveMember = await props.dispatch(deleteWorkspaceMember(props.currentWorkspace.id, memberId))
    switch (fetchWorkspaceRemoveMember.status) {
      case 204:
        props.dispatch(newFlashMessage(props.t('Member removed'), 'info'))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while removing member'), 'warning')); break
    }

    this.setState({ isMemberListLoading: false })
  }

  handleClickOpenAdvancedDashboard = () => {
    const { props, state } = this

    if (state.advancedDashboardOpenedId === null) {
      props.history.push(PAGE.WORKSPACE.ADVANCED_DASHBOARD(props.currentWorkspace.id))
    } else {
      props.dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT('workspace_advanced'), { workspace_id: props.currentWorkspace.id })
    }

    this.setState({ advancedDashboardOpenedId: props.currentWorkspace.id })
  }

  handleClickChangeEmailNotificationType = async (emailNotificationType) => {
    const { props } = this

    let fetchChangeEmailNotificationType
    try {
      fetchChangeEmailNotificationType = await props.dispatch(putMyselfWorkspaceEmailNotificationType(
        props.currentWorkspace.id, emailNotificationType
      ))
    } catch (e) {
      props.dispatch(newFlashMessage(props.t('Error while changing email subscription'), 'warning'))
      console.error(
        'Error while changing email subscription. handleClickChangeEmailNotificationType.',
        fetchChangeEmailNotificationType
      )
    }
  }

  render () {
    const { props, state } = this

    if (props.currentWorkspace.memberList === undefined) {
      return (
        <Loading
          height={100}
          width={100}
        />
      )
    }

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(
      props.user.userId, props.currentWorkspace.memberList, ROLE_LIST
    )

    // INFO - GB - 2019-08-29 - these filters are made temporarily by the frontend, but may change to have all the intelligence in the backend
    // https://github.com/tracim/tracim/issues/2326
    let contentTypeButtonList = []
    if (props.currentWorkspace.publicationEnabled) {
      contentTypeButtonList.push({
        slug: 'news',
        creationLabel: props.t('Publish some news'),
        route: PAGE.WORKSPACE.PUBLICATIONS(props.currentWorkspace.id),
        hexcolor: COLORS.PUBLICATION,
        faIcon: 'fas fa-stream'
      })
    }

    // INFO - MP - 06-09-2022 - Build the application list buttons
    contentTypeButtonList = contentTypeButtonList.concat(props.contentType.length > 0 // INFO - CH - 2019-04-03 - wait for content type api to have responded
      ? props.appList
        .filter(app => userRoleIdInWorkspace === ROLE.contributor.id ? app.slug !== 'contents/folder' : true)
        .filter(app => app.slug === 'agenda' ? props.currentWorkspace.agendaEnabled : true)
        .filter(app => app.slug !== 'contents/share_folder')
        .filter(app => app.slug !== 'share_content')
        .filter(app => app.slug !== 'upload_permission')
        .filter(app => app.slug !== 'contents/todo')
        .map(app => {
          const contentType = props.contentType.find(ct => app.slug.includes(ct.slug)) || { creationLabel: '', slug: '' }
          // INFO - CH - 2019-04-03 - hard coding some agenda properties for now since some end points requires some clarifications
          // these endpoints are /system/applications, /system/content_types and key sidebar_entry from /user/me/workspaces
          // HACK - CH - 2019-09-10 - hard coding collabora creation label from the hack since backend still isn't clear about appList and contentTypeList usage
          // See https://github.com/tracim/tracim/issues/2375
          // HACK - GM - 2019-11-26 - hard coding gallery creation label because gallery don't have a content_type
          const creationLabelWithHACK = (() => {
            switch (app.slug) {
              case 'agenda': return props.t('Open the agenda')
              case 'gallery': return props.t('Open the gallery')
              case 'collaborative_document_edition': return HACK_COLLABORA_CONTENT_TYPE([{}]).creationLabel
              default: return contentType.creationLabel
            }
          })()

          // HACK - CH - 2019-09-10 - hard coding collabora slug from the hack since the collaborative_document has been removed from content type list
          // See https://github.com/tracim/tracim/issues/2375
          const slugWithHACK = app.slug === HACK_COLLABORA_CONTENT_TYPE([{}]).slug
            ? HACK_COLLABORA_CONTENT_TYPE([{}]).slug
            : contentType.slug

          const route = (() => {
            switch (app.slug) {
              case 'agenda': return PAGE.WORKSPACE.AGENDA(props.currentWorkspace.id)
              case 'gallery': return PAGE.WORKSPACE.GALLERY(props.currentWorkspace.id)
              default: return `${PAGE.WORKSPACE.NEW(props.currentWorkspace.id, slugWithHACK)}?parent_id=null`
            }
          })()

          return {
            ...app,
            hexcolor: app.slug === HACK_COLLABORA_CONTENT_TYPE([{}]).slug
              ? HACK_COLLABORA_CONTENT_TYPE([{}]).hexcolor
              : app.hexcolor,
            creationLabel: creationLabelWithHACK,
            route: route
          }
        })
      : []
    )

    const description = addExternalLinksIcons(props.currentWorkspace.description.trim())

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='dashboard'>
            <TabBar
              currentSpace={props.currentWorkspace}
              breadcrumbs={props.breadcrumbs}
              isEmailNotifActivated={props.system.config.email_notification_activated}
            />

            <PageContent>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__content'>
                  <div className='dashboard__workspace__detail'>
                    {(description
                      ? (
                        <div
                          className='dashboard__workspace__detail__description'
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      )
                      : (
                        <div className='dashboard__workspace__detail__description__missing'>
                          {props.t("This space doesn't have a description yet.")}
                        </div>
                      )
                    )}
                  </div>
                  {props.currentWorkspace && props.currentWorkspace.id && (
                    <WorkspaceRecentActivities workspaceId={props.currentWorkspace.id} />
                  )}
                </div>

                <div className='dashboard__workspace__rightMenu'>
                  <UserStatus
                    user={props.user}
                    currentWorkspace={props.currentWorkspace}
                    displayNotifBtn={props.system.config.email_notification_activated}
                    displaySubscriptionRequestsInformation={
                      userRoleIdInWorkspace >= ROLE.workspaceManager.id &&
                      props.currentWorkspace.accessType === SPACE_TYPE.onRequest.slug
                    }
                    newSubscriptionRequestsNumber={state.newSubscriptionRequestsNumber}
                    onClickChangeEmailNotificationType={this.handleClickChangeEmailNotificationType}
                    t={props.t}
                  />

                  <div className='dashboard__workspace__rightMenu__contents'>
                    {contentTypeButtonList.map(app => {
                      return (userRoleIdInWorkspace >= ROLE.contributor.id || ALWAYS_ALLOWED_BUTTON_SLUGS.includes(app.slug)) && (
                        <ContentTypeBtn
                          hexcolor={app.hexcolor}
                          label={app.label}
                          faIcon={app.faIcon}
                          // TODO - Côme - 2018/09/12 - translation key below is a little hacky:
                          // The creation label comes from api but since there is no translation in backend
                          // every files has a 'externalTranslationList' array just to generate the translation key in the json files through i18n.scanner
                          creationLabel={props.t(app.creationLabel)}
                          onClickBtn={() => props.history.push(app.route)}
                          appSlug={app.slug}
                          key={app.slug}
                          dataCy={`create_${app.slug}`}
                        />
                      )
                    })}

                    <IconButton
                      icon='fas fa-fw fa-cog'
                      text={(userRoleIdInWorkspace >= ROLE.contentManager.id
                        ? props.t('Space settings')
                        : props.t('Space information')
                      )}
                      onClick={this.handleClickOpenAdvancedDashboard}
                    />
                  </div>

                  <MemberList
                    customClass='dashboard__memberlist'
                    loggedUser={props.user}
                    apiUrl={FETCH_CONFIG.apiUrl}
                    memberList={props.currentWorkspace.memberList}
                    roleList={ROLE_LIST}
                    searchedKnownMemberList={state.searchedKnownMemberList}
                    autoCompleteFormNewMemberActive={state.autoCompleteFormNewMemberActive}
                    publicName={state.newMember.publicName}
                    isEmail={state.newMember.isEmail}
                    isLoading={state.isMemberListLoading}
                    onChangePersonalData={this.handleChangePersonalData}
                    onClickKnownMember={this.handleClickKnownMember}
                    role={state.newMember.role}
                    onChangeRole={this.handleChangeNewMemberRole}
                    onClickValidateNewMember={this.handleClickValidateNewMember}
                    displayNewMemberForm={state.displayNewMemberForm}
                    onClickAddMemberBtn={this.handleClickAddMemberBtn}
                    onClickCloseAddMemberBtn={this.handleClickCloseAddMemberBtn}
                    onClickRemoveMember={this.handleClickRemoveMember}
                    userRoleIdInWorkspace={userRoleIdInWorkspace}
                    canSendInviteNewUser={[PROFILE.administrator.slug, PROFILE.manager.slug].includes(props.user.profile)}
                    isEmailNotifActivated={props.system.config.email_notification_activated}
                    autoCompleteClicked={state.autoCompleteClicked}
                    onClickAutoComplete={this.handleClickAutoComplete}
                    t={props.t}
                  />
                </div>
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, contentType, appList, currentWorkspace, system }) => ({
  breadcrumbs, user, contentType, appList, currentWorkspace, system
})
export default connect(mapStateToProps)(withRouter(appFactory(translate()(TracimComponent(Dashboard)))))
