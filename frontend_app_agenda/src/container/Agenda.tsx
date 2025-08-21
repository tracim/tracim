import React, { createRef } from 'react'
import type { ReactElement } from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n'
import {
  addAllResourceI18n,
  handleFetchResult,
  getWorkspaceDetail,
  getSpaceUserRoleList,
  sendGlobalFlashMessage,
  PageContent,
  PageTitle,
  PageWrapper,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  PAGE,
  RefreshWarningMessage,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TracimComponent
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
import { getResourceList, getPreFilledAgendaEvent } from '../action.async'
import { createCalendar } from 'open-dav-calendar'

export class Agenda extends React.Component<any, any> {
  calendarRef = createRef<HTMLDivElement>()

  constructor (props: any) {
    super(props)
    const param = (props.data !== undefined) ? props.data : debug
    this.state = {
      appName: 'agenda',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      agendaList: [],
      addressBookList: [],
      userWorkspaceListLoaded: false,
      preFilledAgendaEvent: null,
      breadcrumbsList: [],
      appMounted: false,
      editionAuthor: '',
      showRefreshWarning: false,
      calendar: null
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleSharedspaceModified }
    ])
  }

  // Custom Event Handlers
  handleShowApp = (data: any): void => {
    console.log('%c<Agenda> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(this.state.config.slug), data)
    if (data.config.appConfig.workspaceId !== this.state.config.appConfig.workspaceId) {
      this.setState({ config: data.config })
    }
  }

  handleAllAppChangeLanguage = (data: any): void => {
    const { props, state } = this
    console.log('%c<Agenda> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    this.setState((prev: any) => ({
      loggedUser: {
        ...prev.loggedUser,
        lang: data
      }
    }))
    i18n.changeLanguage(data)
    this.buildBreadcrumbs()
    this.setHeadTitle(state.config.appConfig.workspaceId !== null
      ? `${props.t('Agenda') as string} · ${state.content.workspaceLabel as string}`
      : props.t('My agendas')
    )
  }

  // TLM Handlers
  handleUserModified = (data: any): void => {
    if (this.state.loggedUser.userId !== data.fields.user.user_id) return

    this.setState((prev: any) => ({
      loggedUser: {
        ...prev.loggedUser,
        authType: data.fields.user.auth_type,
        avatarUrl: data.fields.user.avatar_url,
        email: data.fields.user.email,
        isActive: data.fields.user.is_active,
        profile: data.fields.user.profile,
        publicName: data.fields.user.public_name,
        timezone: data.fields.user.timezone,
        username: data.fields.user.username
      },
      editionAuthor: data.fields.author.public_name,
      // INFO - GB - 2020-06-18 - Just show the warning message if there have been any changes in "My agendas" page and if it's not the language that changes (handled by custom event)
      // state.agendaList.length !== 1 represents "My Agendas" page because for the agendas of a specific workspace the state.agendaList.length is always 1 (there is only the workspace in the list)
      // and there is no need to show the warning in these agendas because there is no data that can be changed visible.
      showRefreshWarning: prev.agendaList.length !== 1 && prev.loggedUser.lang === data.fields.user.lang
    }))
  }

  handleSharedspaceModified = (data: any): void => {
    const { state } = this
    if (state.agendaList.find((workspace: any) => workspace.workspace_id === data.fields.workspace.workspace_id) === undefined) return

    this.setState({
      content: {
        workspaceLabel: data.fields.workspace.label
      },
      editionAuthor: data.fields.author.public_name,
      // INFO - GB - 2020-06-18 - Just show the warning message if there have been any changes in "My agendas" page
      // state.agendaList.length !== 1 represents "My Agendas" page because for the agendas of a specific workspace the state.agendaList.length is always 1 (there is only the workspace in the list)
      // and there is no need to show the warning in these agendas because there is no data that can be changed visible.
      showRefreshWarning: state.agendaList.length !== 1
    })
    if (state.agendaList.length === 1) this.buildBreadcrumbs()
  }

  async componentDidMount (): Promise<void> {
    const { state, props } = this
    console.log('%c<Agenda> did mount', `color: ${state.config.hexcolor as string}`)

    void this.loadAgendaList(state.config.appConfig.workspaceId)
    void this.loadPrefilledAgendaEvent()
    if (state.config.appConfig.workspaceId !== null) {
      await this.loadWorkspaceData()
    } else {
      this.setHeadTitle(props.t('My agendas'))
    }
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (_: any, prevState: any): Promise<void> {
    const { state } = this
    // console.log('%c<Agenda> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.workspaceId !== state.config.appConfig.workspaceId) {
      if (state.config.appConfig.workspaceId !== null && Boolean(state.config.appConfig.workspaceId)) await this.loadAgendaList(state.config.appConfig.workspaceId)
      await this.loadWorkspaceData()
      this.buildBreadcrumbs()
    }

    if (this.calendarRef.current !== null &&
      state.userWorkspaceListLoaded as boolean &&
      (prevState.loggedUser.lang !== state.loggedUser.lang || state.calendar === null)
    ) {
      void this.buildCalendar()
    }
  }

  handleClickRefresh = (): void => {
    this.setState({ showRefreshWarning: false })
  }

  setHeadTitle = (title: string): void => {
    // @ts-expect-error global variable
    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.SET_HEAD_TITLE,
      data: { title }
    })
  }

  loadAgendaList = async (workspaceId: number): Promise<void> => {
    const { state, props } = this

    const fetchResultUserWorkspace = await handleFetchResult(
      await getResourceList(state.config.apiUrl, workspaceId)
    )

    switch (fetchResultUserWorkspace.apiResponse.status) {
      case 200:
        void this.loadUserRoleInWorkspace(fetchResultUserWorkspace.body)
        break
      case 400:
        switch (fetchResultUserWorkspace.body.code) {
          default: sendGlobalFlashMessage(props.t('Error while loading space list'))
        }
        break
      default: sendGlobalFlashMessage(props.t('Error while loading space list'))
    }
  }

  async loadPrefilledAgendaEvent (): Promise<void> {
    const fetchGetPreFilledAgendaEvent = await handleFetchResult(
      await getPreFilledAgendaEvent(this.state.config.apiUrl)
    )

    if (fetchGetPreFilledAgendaEvent.apiResponse.ok as boolean) {
      this.setState({ preFilledAgendaEvent: fetchGetPreFilledAgendaEvent.body })
    } else {
      sendGlobalFlashMessage(this.props.t('Error while loading pre-filled agenda event information'))
      this.setState({ preFilledAgendaEvent: {} })
    }
  }

  // INFO - CH - 2019-04-09 - This function is complicated because, right now, the only way to get the user's role
  // on a workspace is to extract it from the members list that workspace
  // see https://github.com/tracim/tracim/issues/1581
  loadUserRoleInWorkspace = async (resourceList: any[]): Promise<void> => {
    const { state, props } = this
    const fetchResultList = await Promise.all(
      resourceList
        .filter(a => a.agenda_type === 'workspace')
        .map(async a => {
          const fetchWorkspaceUserRoleList = await handleFetchResult(await getSpaceUserRoleList(state.config.apiUrl, a.workspace_id))
          return fetchWorkspaceUserRoleList
        })
    )

    const fetchResultSuccess = fetchResultList.filter(result => result.apiResponse.status === 200)
    if (fetchResultSuccess.length < fetchResultList.length) sendGlobalFlashMessage(props.t('Some agenda or address books could not be loaded'))

    const workspaceListMemberList = fetchResultSuccess.map(result => ({
      workspaceId: result.body[0].workspace_id, // INFO - CH - 2019-04-09 - workspaces always have at least one member
      memberList: result.body
    }))

    const resourceThatCouldGetRoleFrom = resourceList
      // INFO - CH - 2019-04-09 - remove user's agenda
      .filter(a => a.agenda_type === 'workspace')
      // INFO - CH - 2019-04-09 - remove unloaded members list agenda
      .filter(a => workspaceListMemberList.map(ws => ws.workspaceId).includes(a.workspace_id))

    const resourceListWithRole = resourceThatCouldGetRoleFrom.map(resource => ({
      ...resource,
      loggedUserRole: (workspaceListMemberList
        .find(ws => ws.workspaceId === resource.workspace_id) ?? { memberList: [] })
        .memberList
        .find((user: any) => user.user_id === state.loggedUser.userId)
        .role
    }))

    if (state.config.appConfig.workspaceId === null) {
      resourceListWithRole.push(...resourceList.filter(a => a.agenda_type === 'private'))
    }

    const agendaListWithRole = resourceListWithRole.filter(r => r.resource_type === 'calendar')
    const addressBookListWithRole = resourceListWithRole.filter(r => r.resource_type === 'addressbook')

    this.setState({
      agendaList: agendaListWithRole,
      addressBookList: addressBookListWithRole,
      userWorkspaceListLoaded: true
    })
  }

  buildBreadcrumbs = (): void => {
    const { props, state } = this

    const breadcrumbsList = []

    const workspaceId: number | null = state.config.appConfig.workspaceId
    if (workspaceId !== null && Boolean(workspaceId)) {
      breadcrumbsList.push({
        link: PAGE.WORKSPACE.DASHBOARD(workspaceId),
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN,
        label: state.content.workspaceLabel,
        isALink: true
      }, {
        link: PAGE.WORKSPACE.AGENDA(workspaceId),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.t('Agenda'),
        isALink: true
      })
    } else {
      breadcrumbsList.push({
        link: PAGE.AGENDA,
        type: BREADCRUMBS_TYPE.CORE,
        label: props.t('All my agendas'),
        isALink: true
      })
    }

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({ breadcrumbsList })
  }

  buildCalendar = async (): Promise<void> => {
    if (this.calendarRef.current === null) return

    const { state, props } = this
    state.calendar?.destroy()

    // FIXME - CJ - 2025-07-03 - `workspace.withCredentials` should probably be handle
    const calendar = await createCalendar(
      state.agendaList.map((workspace: any) => ({ calendarUrl: workspace.agenda_url })),
      state.addressBookList.map((workspace: any) => ({ addressBookUrl: workspace.agenda_url })),
      this.calendarRef.current,
      {
        hideVCardEmails: true,
        userContact: {
          name: state.loggedUser.publicName,
          email: state.loggedUser.email
        }
      },
      {
        calendarElement: {
          timeGridDay: props.t('Day'),
          timeGridWeek: props.t('Week'),
          dayGridMonth: props.t('Month'),
          listDay: props.t('List'),
          listWeek: props.t('List Week'),
          listMonth: props.t('List Month'),
          listYear: props.t('List Year'),
          today: props.t('Today'),
          allDay: props.t('Daily'),
          calendars: props.t('Calendars'),
          newEvent: props.t('New Event')
        },
        eventForm: {
          allDay: props.t('Daily'),
          calendar: props.t('Calendar'),
          title: props.t('Title'),
          location: props.t('Location'),
          start: props.t('Start'),
          end: props.t('End'),
          organizer: props.t('Organizer'),
          attendees: props.t('Attendees'),
          addAttendee: props.t('Add attendee'),
          description: props.t('Description'),
          delete: props.t('Delete'),
          cancel: props.t('Cancel'),
          save: props.t('Save'),
          chooseACalendar: props.t('-- Choose a calendar --'),
          rrule: props.t('Frequency'),
          userInvite: props.t('You were invited to this event')
        },
        eventBody: {
          organizer: props.t('Organizer'),
          participation_require: props.t('Required participant'),
          participation_optional: props.t('Optional participant'),
          non_participant: props.t('Non participant'),
          participation_confirmed: props.t('Participation confirmed'),
          participation_pending: props.t('Participation pending'),
          participation_confirmed_tentative: props.t('Participation confirmed tentative'),
          participation_declined: props.t('Participation declined')
        },
        recurringForm: {
          editRecurring: props.t('This is a recurring event'),
          editAll: props.t('Edit all occurrences'),
          editSingle: props.t('Edit this occurrence only')
        },
        userParticipationStatus: {
          'NEEDS-ACTION': props.t('Not answered'),
          ACCEPTED: props.t('Accept'),
          DECLINED: props.t('Decline'),
          TENTATIVE: props.t('Accept tentatively')
        },
        participationStatus: {
          'NEEDS-ACTION': props.t('Needs to answer'),
          ACCEPTED: props.t('Accepted'),
          DECLINED: props.t('Declined'),
          TENTATIVE: props.t('Tentatively accepted'),
          DELEGATED: props.t('Delegated')
        },
        attendeeRoles: {
          CHAIR: props.t('Chair'),
          'REQ-PARTICIPANT': props.t('Required participant'),
          'OPT-PARTICIPANT': props.t('Optional participant'),
          'NON-PARTICIPANT': props.t('Non participant')
        },
        rrules: {
          none: props.t('Never'),
          unchanged: props.t('Keep existing'),
          'FREQ=DAILY': props.t('Daily_f'),
          'FREQ=WEEKLY': props.t('Weekly'),
          'BYDAY=MO,TU,WE,TH,FR;FREQ=DAILY': props.t('Workdays'),
          'INTERVAL=2;FREQ=WEEKLY': props.t('Every two week'),
          'FREQ=MONTHLY': props.t('Monthly'),
          'FREQ=YEARLY': props.t('Yearly')
        }
      }
    )
    this.setState({ calendar })
  }

  loadWorkspaceData = async (): Promise<void> => {
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
        this.setHeadTitle(`${props.t('Agenda') as string} · ${fetchResultWorkspaceDetail.body.label as string}`)
    }
  }

  render (): ReactElement | null {
    const { props, state } = this

    if (!(state.isVisible as boolean) || !(state.userWorkspaceListLoaded as boolean) || state.preFilledAgendaEvent === null) return null

    // INFO - GB - 2019-06-11 - This tag dangerouslySetInnerHTML is needed to i18next be able to handle special characters
    // https://github.com/tracim/tracim/issues/1847
    const pageTitle = state.config.appConfig.workspaceId === null
      ? props.t('All my agendas')
      : (
        <div
          dangerouslySetInnerHTML={{
            __html: props.t(
              'Agenda of space {{workspaceLabel}}', {
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
          icon='fas fa-calendar-alt'
          breadcrumbsList={state.breadcrumbsList}
          isEmailNotifActivated={state.config.system.config.email_notification_activated}
        />

        <div className='agendaPage__warningMessage'>
          {state.showRefreshWarning as boolean && (
            <RefreshWarningMessage
              tooltip={props.t('Some information was modified by {{author}}', { author: state.editionAuthor, interpolation: { escapeValue: false } })}
              onClickRefresh={this.handleClickRefresh}
            />
          )}
        </div>

        <PageContent parentClass='agendaPage'>
          <div ref={this.calendarRef} style={{ height: '100%' }} />
        </PageContent>
      </PageWrapper>
    )
  }
}

export default translate()(TracimComponent(Agenda))
