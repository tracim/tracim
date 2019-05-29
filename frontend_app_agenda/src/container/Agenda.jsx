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
  BREADCRUMBS_TYPE
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

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this

    switch (type) {
      case 'agenda_showApp':
        console.log('%c<Agenda> Custom event', 'color: #28a745', type, data)
        if (data.config.appConfig.idWorkspace !== state.config.appConfig.idWorkspace) {
          // this.loadAgendaList(data.config.appConfig.idWorkspace)
          // this.buildBreadcrumbs()
          this.setState({config: data.config})
        }
        break
      case 'allApp_changeLang':
        console.log('%c<Agenda> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.buildBreadcrumbs()
        this.agendaIframe.contentWindow.location.reload()
        break
      default:
        break
    }
  }

  async componentDidMount () {
    const { state } = this

    console.log('%c<Agenda> did mount', `color: ${state.config.hexcolor}`)

    this.loadAgendaList(state.config.appConfig.idWorkspace)
    if (state.config.appConfig.idWorkspace !== null) await this.loadWorkspaceData()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Agenda> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.idWorkspace !== state.config.appConfig.idWorkspace) {
      if (state.config.appConfig.idWorkspace) await this.loadAgendaList(state.config.appConfig.idWorkspace)
      await this.loadWorkspaceData()
      this.buildBreadcrumbs()
      this.agendaIframe.contentWindow.location.reload()
    }
  }

  componentWillUnmount () {
    console.log('%c<Agenda> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadAgendaList = async idWorkspace => {
    const { state } = this

    const fetchResultUserWorkspace = await handleFetchResult(
      await getAgendaList(state.config.apiUrl, idWorkspace)
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
    const { state } = this
    const fetchResultList = await Promise.all(
      agendaList
        .filter(a => a.agenda_type === 'workspace')
        .map(async a => await handleFetchResult(await getWorkspaceMemberList(state.config.apiUrl, a.workspace_id)))
    )

    const fetchResultSuccess = fetchResultList.filter(result => result.apiResponse.status === 200)
    if (fetchResultSuccess.length < fetchResultList.length) this.sendGlobalFlashMessage(props.t('Some agenda could not be loaded'))

    const workspaceListMemberList = fetchResultSuccess.map(result => ({
      idWorkspace: result.body[0].workspace_id, // INFO - CH - 2019-04-09 - workspaces always have at least one member
      memberList: result.body || []
    }))

    const agendaThatCouldGetRoleFrom = agendaList
      // INFO - CH - 2019-04-09 - remove user's agenda
      .filter(a => a.agenda_type === 'workspace')
      // INFO - CH - 2019-04-09 - remove unloaded members list agenda
      .filter(a => workspaceListMemberList.map(ws => ws.idWorkspace).includes(a.workspace_id))

    const agendaListWithRole = agendaThatCouldGetRoleFrom.map(agenda => ({
      ...agenda,
      loggedUserRole: workspaceListMemberList
        .find(ws => ws.idWorkspace === agenda.workspace_id)
        .memberList
        .find(user => user.user_id === state.loggedUser.user_id)
        .role
    }))

    if (state.config.appConfig.idWorkspace === null) {
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
      link: <Link to={'/ui'}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }]

    if (state.config.appConfig.idWorkspace) {
      breadcrumbsList.push({
        link: <Link to={`/ui/workspaces/${state.config.appConfig.idWorkspace}/dashboard`}>{state.content.workspaceLabel}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      }, {
        link: <Link to={`/ui/workspaces/${state.config.appConfig.idWorkspace}/agenda`}>{props.t('Agenda')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    } else {
      breadcrumbsList.push({
        link: <Link to={`/ui/agenda`}>{props.t('All my agendas')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({breadcrumbsList: breadcrumbsList})
  }

  loadWorkspaceData = async () => {
    const { state } = this

    const fetchResultWorkspaceDetail = await handleFetchResult(
      await getWorkspaceDetail(state.config.apiUrl, state.config.appConfig.idWorkspace)
    )

    switch (fetchResultWorkspaceDetail.apiResponse.status) {
      case 200:
        this.setState({
          content: {
            workspaceLabel: fetchResultWorkspaceDetail.body.label
          }
        })
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
          idWorkspace: a.agenda_type === 'private' ? '' : a.workspace_id
        }))
      },
      userLang: state.loggedUser.lang,
      shouldShowCaldavzapSidebar: state.config.appConfig.forceShowSidebar
    }

    const pageTitle = state.config.appConfig.idWorkspace === null
      ? props.t('All my agendas')
      : props.t('Agenda of shared space {{workspaceLabel}}', {workspaceLabel: state.content.workspaceLabel})

    return (
      <PageWrapper customClass='agendaPage'>
        <PageTitle
          parentClass='agendaPage'
          title={pageTitle}
          icon={'calendar'}
          breadcrumbsList={state.breadcrumbsList}
        />

        <PageContent parentClass='agendaPage'>
          <iframe
            id='agendaIframe'
            src='/assets/_caldavzap/index.tracim.html'
            allow='fullscreen'
            allowfullscreen
            data-config={JSON.stringify(config)}
            ref={f => this.agendaIframe = f}
          />
        </PageContent>
      </PageWrapper>
    )
  }
}

export default translate()(Agenda)
