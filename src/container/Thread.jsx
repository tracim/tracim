import React from 'react'
import i18n from '../i18n.js'
import { debug } from '../helper.js'
import {
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  SelectStatus,
  ArchiveDeleteContent
} from 'tracim_lib'
import {
  getThreadContent,
  getThreadComment,
  postThreadNewComment,
  putThreadStatus,
  putThreadContent
} from '../action.async.js'

class Thread extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'thread',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      listMessage: props.data ? [] : [], // debug.listMessage,
      newComment: '',
      timelineWysiwyg: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: action }) => { // action: { type: '', data: {} }
    switch (action.type) {
      case 'Thread_showApp':
        this.setState({isVisible: true})
        break
      case 'Thread_hideApp':
        this.setState({isVisible: false})
        break
    }
  }

  componentDidMount () {
    console.log('Thread did Mount')
    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('Thread did Update', prevState, state)
    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) this.loadContent()

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  loadContent = async () => {
    const { content, config } = this.state

    if (content.content_id === '-1') return // debug case

    const fetchResultThread = getThreadContent(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultThreadComment = getThreadComment(config.apiUrl, content.workspace_id, content.content_id)

    Promise.all([
      handleFetchResult(await fetchResultThread),
      handleFetchResult(await fetchResultThreadComment)
    ])
      .then(([resThread, resComment]) => this.setState({
        content: resThread.body,
        listMessage: resComment.body.map(c => ({
          ...c,
          timelineType: 'comment',
          created: (new Date(c.created)).toLocaleString()
        }))
      }))
      .catch(e => console.log('Error loading Thread data.', e))
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditTitle = async newTitle => {
    const { config, content } = this.state

    const fetchResultSaveThread = putThreadContent(config.apiUrl, content.workspace_id, content.content_id, newTitle)

    handleFetchResult(await fetchResultSaveThread)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) this.loadContent()
        else console.warn('Error saving threads. Result:', resSave, 'content:', content, 'config:', config)
      })
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({newComment})
  }

  handleClickValidateNewCommentBtn = async () => {
    const { config, content, newComment } = this.state

    const fetchResultSaveNewComment = await postThreadNewComment(config.apiUrl, content.workspace_id, content.content_id, newComment)

    handleFetchResult(await fetchResultSaveNewComment)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.setState({newComment: ''})
          if (this.state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
          this.loadContent()
        } else {
          console.warn('Error saving thread comment. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleToggleWysiwyg = () => this.setState(prev => ({timelineWysiwyg: !prev.timelineWysiwyg}))

  handleChangeStatus = async newStatus => {
    const { config, content } = this.state

    const fetchResultSaveEditStatus = putThreadStatus(config.apiUrl, content.workspace_id, content.content_id, newStatus)

    handleFetchResult(await fetchResultSaveEditStatus)
      .then(resSave => {
        if (resSave.apiResponse.status !== 204) { // 204 no content so dont take status from resSave.apiResponse.status
          console.warn('Error saving thread comment. Result:', resSave, 'content:', content, 'config:', config)
        } else {
          this.loadContent()
        }
      })
  }

  handleClickArchive = () => console.log('archive nyi')

  handleClickDelete = () => console.log('delete nyi')

  render () {
    const { config, isVisible, loggedUser, content, listMessage, newComment, timelineWysiwyg } = this.state

    if (!isVisible) return null

    return (
      <PopinFixed customClass={`wsContentThread`}>
        <PopinFixedHeader
          customClass={`wsContentThread`}
          faIcon={config.faIcon}
          title={content.label}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
        />

        <PopinFixedOption customClass={`wsContentThread`} i18n={i18n}>
          <div className='justify-content-end'>
            <SelectStatus
              selectedStatus={config.availableStatuses.find(s => s.slug === content.status)}
              availableStatus={config.availableStatuses}
              onChangeStatus={this.handleChangeStatus}
              disabled={false}
            />

            <ArchiveDeleteContent
              onClickArchiveBtn={this.handleClickArchive}
              onClickDeleteBtn={this.handleClickDelete}
              disabled={false}
            />
          </div>
        </PopinFixedOption>

        <PopinFixedContent customClass={`${config.customClass}__contentpage`}>
          <Timeline
            customClass={`${config.slug}__contentpage`}
            loggedUser={loggedUser}
            timelineData={listMessage}
            newComment={newComment}
            disableComment={false}
            wysiwyg={timelineWysiwyg}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onClickRevisionBtn={() => {}}
            shouldScrollToBottom={false}
            showHeader={false}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default Thread
