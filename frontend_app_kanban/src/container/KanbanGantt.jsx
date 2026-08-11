import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  addAllResourceI18n,
  appContentFactory,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  FilenameWithBadges,
  getFileContent,
  getRawFileContent,
  getOrCreateSessionClientToken,
  handleFetchResult,
  PAGE,
  PopinFixed,
  PopinFixedContent,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent
} from 'tracim_frontend_lib'
import { KANBAN_FILE_EXTENSION } from '../helper.js'

import KanbanGanttComponent from '../component/KanbanGantt.jsx'

const KANBAN_GET_URL_FILENAME = 'kanban' + KANBAN_FILE_EXTENSION

export class KanbanGantt extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'kanbanGantt',
      breadcrumbsList: [],
      content: param.content,
      columns: [],
      config: param.config,
      disableChangeTitle: true,
      editionAuthor: '',
      loading: false,
      loggedUser: param.loggedUser,
      newContent: {},
      showRefreshWarning: false
    }
    this.sessionClientToken = getOrCreateSessionClientToken()

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.KANBAN, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.KANBAN, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.KANBAN, handler: this.handleContentChanged }
    ])
  }

  componentDidMount () {
    console.log('%c<KanbanGantt> did Mount', `color: ${this.state.config.hexcolor}`)
    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this
    console.log('%c<KanbanGantt> did Update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!state.content.current_revision_id) return

    if (prevState.content.current_revision_id !== state.content.current_revision_id) {
      this.loadBoardContent()
    }
  }

  buildBreadcrumbs = async content => {
    const { props, state } = this

    const breadcrumbsList = [
      {
        link: PAGE.WORKSPACE.DASHBOARD(content.workspace_id),
        label: state.config.workspace.label,
        type: BREADCRUMBS_TYPE.CORE,
        isALink: true
      },
      {
        link: PAGE.WORKSPACE.KANBAN(state.content.workspace_id, state.content.content_id),
        label: state.content.label,
        type: BREADCRUMBS_TYPE.CORE,
        isALink: true
      },
      {
        link: PAGE.WORKSPACE.KANBAN_GANTT(state.content.workspace_id, state.content.content_id),
        label: props.t('Gantt'),
        type: BREADCRUMBS_TYPE.APP_FEATURE,
        isALink: true
      }
    ]

    this.setState({ breadcrumbsList })
  }

  setHeadTitle = (contentName) => {
    const { state } = this

    if (!contentName) return

    if (state.config && state.config.workspace) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([contentName, state.config.workspace.label]) }
      })
    }
  }

  // Events Handlers

  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<KanbanGantt> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)
    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  // TLM Handlers

  handleContentChanged = data => {
    const { state } = this

    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    const newContentObject = { ...state.content, ...data.fields.content }

    this.setState(prev => ({
      content: clientToken === data.fields.client_token ? newContentObject : prev.content,
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(newContentObject.label)
      this.buildBreadcrumbs(newContentObject)
    }
  }

  // Renderer Handlers

  handleClickRefresh = async () => {
    const { state } = this

    this.setState({
      content: state.newContent,
      showRefreshWarning: false
    }, async () => {
      this.setHeadTitle(state.content.label)
      this.buildBreadcrumbs(state.content)

      await this.loadBoardContent()
    })
  }

  handleClickBtnCloseApp = () => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.REDIRECT,
      data: {
        url: PAGE.WORKSPACE.KANBAN(state.content.workspace_id, state.content.content_id)
      }
    })
  }

  loadContent = async () => {
    const { state } = this

    this.setState({ loading: true })

    const response = await handleFetchResult(
      await getFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    )

    this.setState({ content: response.body })
    await this.buildBreadcrumbs(response.body)
  }

  loadBoardContent = async () => {
    const { state } = this

    this.setState({ loading: true })

    try {
      const fetchRawFileContent = await handleFetchResult(
        await getRawFileContent(
          state.config.apiUrl,
          state.content.workspace_id,
          state.content.content_id,
          state.content.current_revision_id,
          KANBAN_GET_URL_FILENAME
        ),
        true
      )

      if (fetchRawFileContent.apiResponse.ok && fetchRawFileContent.body.columns) {
        this.setState({
          columns: fetchRawFileContent.body.columns || []
        })
      }
    } catch (error) {
      console.log(`Got an error while fetching the board's contents: ${error}`)
    }

    this.setState({
      loading: false,
      newContent: {}
    })
  }

  render () {
    const { state } = this

    if (!state.content.current_revision_id) return null

    return (
      <PopinFixed
        customClass={`${state.config.slug}__gantt`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedContent
          breadcrumbsList={state.breadcrumbsList}
          config={state.config}
          componentTitle={<FilenameWithBadges content={state.content} />}
          content={state.content}
          customClass={`${state.config.slug}__gantt__contentpage`}
          disableChangeTitle={state.disableChangeTitle}
          isRefreshNeeded={state.showRefreshWarning}
          loading={state.loading}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        >
          <KanbanGanttComponent
            columns={state.columns}
            config={state.config}
            editionAuthor={state.editionAuthor}
            isRefreshNeeded={state.showRefreshWarning}
            language={state.loggedUser.lang}
            onClickRefresh={this.handleClickRefresh}
          />
          {/* Trick to activate the PopinFixedHeader with only one child */}
          <div />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(KanbanGantt)))
