import React from 'react'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  PageContent,
  PageTitle,
  PageWrapper,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  buildHeadTitle
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import {
  getAgendaList,
  getWorkspaceDetail,
  getWorkspaceMemberList
} from '../action.async.js'

class Agenda extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'agenda',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      userWorkspaceList: [],
      userWorkspaceListLoaded: false,
      breadcrumbsList: [],
      appMounted: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    const { state, props } = this

    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<Agenda> Custom event', 'color: #28a745', type, data)
        if (data.config.appConfig.workspaceId !== state.config.appConfig.workspaceId) {
          this.setState({ config: data.config })
        }
        break
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<Agenda> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.buildBreadcrumbs()
        this.setHeadTitle(state.config.appConfig.workspaceId !== null
          ? `${props.t('Agenda')} · ${state.content.workspaceLabel}`
          : props.t('My agendas')
        )
        this.agendaIframe.contentWindow.location.reload()
        break
      default:
        break
    }
  }

  async componentDidMount () {
    const { state, props } = this

    console.log('%c<Agenda> did mount', `color: ${state.config.hexcolor}`)

    this.loadAgendaList(state.config.appConfig.workspaceId)
    if (state.config.appConfig.workspaceId !== null) {
      await this.loadWorkspaceData()
    } else {
      this.setHeadTitle(props.t('My agendas'))
    }
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Agenda> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.workspaceId !== state.config.appConfig.workspaceId) {
      if (state.config.appConfig.workspaceId) await this.loadAgendaList(state.config.appConfig.workspaceId)
      await this.loadWorkspaceData()
      this.buildBreadcrumbs()
      this.agendaIframe.contentWindow.location.reload()
    }
  }

  componentWillUnmount () {
    console.log('%c<Agenda> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  setHeadTitle = (title) => {
    const { state } = this

    if (state.config && state.config.system && state.config.system.config) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([title, state.config.system.config.instance_name]) }
      })
    }
  }

  loadAgendaList = async workspaceId => {
    const { state, props } = this

    const fetchResultUserWorkspace = await handleFetchResult(
      await getAgendaList(state.config.apiUrl, workspaceId)
    )

    switch (fetchResultUserWorkspace.apiResponse.status) {
      case 200:
        this.loadUserRoleInWorkspace(fetchResultUserWorkspace.body)
        break
      case 400:
        switch (fetchResultUserWorkspace.body.code) {
          default: this.sendGlobalFlashMessage(props.t('Error while loading shared space list'))
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading shared space list'))
    }
  }

  // INFO - CH - 2019-04-09 - This function is complicated because, right now, the only way to get the user's role
  // on a workspace is to extract it from the members list that workspace
  // see https://github.com/tracim/tracim/issues/1581
  loadUserRoleInWorkspace = async agendaList => {
    const { state, props } = this
    const fetchResultList = await Promise.all(
      agendaList
        .filter(a => a.agenda_type === 'workspace')
        .map(async a => {
          const fetchWorkspaceMemberList = await handleFetchResult(await getWorkspaceMemberList(state.config.apiUrl, a.workspace_id))
          return fetchWorkspaceMemberList
        })
    )

    const fetchResultSuccess = fetchResultList.filter(result => result.apiResponse.status === 200)
    if (fetchResultSuccess.length < fetchResultList.length) this.sendGlobalFlashMessage(props.t('Some agenda could not be loaded'))

    const workspaceListMemberList = fetchResultSuccess.map(result => ({
      workspaceId: result.body[0].workspace_id, // INFO - CH - 2019-04-09 - workspaces always have at least one member
      memberList: result.body || []
    }))

    const agendaThatCouldGetRoleFrom = agendaList
      // INFO - CH - 2019-04-09 - remove user's agenda
      .filter(a => a.agenda_type === 'workspace')
      // INFO - CH - 2019-04-09 - remove unloaded members list agenda
      .filter(a => workspaceListMemberList.map(ws => ws.workspaceId).includes(a.workspace_id))

    const agendaListWithRole = agendaThatCouldGetRoleFrom.map(agenda => ({
      ...agenda,
      loggedUserRole: workspaceListMemberList
        .find(ws => ws.workspaceId === agenda.workspace_id)
        .memberList
        .find(user => user.user_id === state.loggedUser.userId)
        .role
    }))

    if (state.config.appConfig.workspaceId === null) {
      agendaListWithRole.push(agendaList.find(a => a.agenda_type === 'private'))
    }

    this.setState({
      userWorkspaceList: agendaListWithRole,
      userWorkspaceListLoaded: true
    })
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: <Link to='/ui'><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }]

    if (state.config.appConfig.workspaceId) {
      breadcrumbsList.push({
        link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/dashboard`}>{state.content.workspaceLabel}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      }, {
        link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/agenda`}>{props.t('Agenda')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    } else {
      breadcrumbsList.push({
        link: <Link to='/ui/agenda'>{props.t('All my agendas')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({ breadcrumbsList: breadcrumbsList })
  }

  loadWorkspaceData = async () => {
    const { state, props } = this

    const fetchResultWorkspaceDetail = await handleFetchResult(
      await getWorkspaceDetail(state.config.apiUrl, state.config.appConfig.workspaceId)
    )

    switch (fetchResultWorkspaceDetail.apiResponse.status) {
      case 200:
        this.setState({
          content: {
            workspaceLabel: fetchResultWorkspaceDetail.body.label
          }
        })
        this.setHeadTitle(`${props.t('Agenda')} · ${fetchResultWorkspaceDetail.body.label}`)
    }
  }

  render () {
    const { props, state } = this

    if (!state.isVisible || !state.userWorkspaceListLoaded) return null

    const config = {
      globalAccountSettings: {
        agendaList: state.userWorkspaceList.map(a => ({
          href: a.agenda_url,
          hrefLabel: a.agenda_type === 'private'
            ? props.t('User')
            : state.userWorkspaceList.length > 1 ? props.t('Shared spaces') : props.t('Shared space'),
          settingsAccount: a.agenda_type === 'private',
          withCredentials: a.with_credentials,
          loggedUserRole: a.agenda_type === 'private' ? '' : a.loggedUserRole,
          workspaceId: a.agenda_type === 'private' ? '' : a.workspace_id
        }))
      },
      userLang: state.loggedUser.lang,
      shouldShowCaldavzapSidebar: state.config.appConfig.forceShowSidebar
    }

    // INFO - GB - 2019-06-11 - This tag dangerouslySetInnerHTML is needed to i18next be able to handle special characters
    // https://github.com/tracim/tracim/issues/1847
    const pageTitle = state.config.appConfig.workspaceId === null
      ? props.t('All my agendas')
      : (
        <div
          dangerouslySetInnerHTML={{
            __html: props.t(
              'Agenda of shared space {{workspaceLabel}}', {
                workspaceLabel: state.content.workspaceLabel,
                interpolation: { escapeValue: false }
              }
            )
          }}
        />
      )

    return (
      <PageWrapper customClass='agendaPage'>
        <PageTitle
          parentClass='agendaPage'
          title={pageTitle}
          icon='calendar'
          breadcrumbsList={state.breadcrumbsList}
        />

        <PageContent parentClass='agendaPage'>
          <iframe
            id='agendaIframe'
            src='/assets/_caldavzap/index.tracim.html'
            allow='fullscreen'
            allowfullscreen
            data-config={JSON.stringify(config)}
            ref={f => { this.agendaIframe = f }}
          />
        </PageContent>
      </PageWrapper>
    )
  }
}

export default translate()(Agenda)
