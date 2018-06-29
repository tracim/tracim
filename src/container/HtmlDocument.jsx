import React from 'react'
import HtmlDocumentComponent from '../component/HtmlDocument.jsx'
import {
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline
} from 'tracim_lib'
import { FETCH_CONFIG, MODE, debug } from '../helper.js'
import i18n from '../i18n.js'

class HtmlDocument extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'html-documents',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      timeline: props.data ? [] : [], // debug.timeline,
      newComment: '',
      mode: MODE.VIEW
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'html-documents_showApp':
        this.setState({isVisible: true})
        break
      case 'html-documents_hideApp':
        this.setState({isVisible: false})
        break
      case 'html-documents_reloadContent':
        this.setState({content: data})
    }
  }

  componentDidMount () {
    console.log('HtmlDocument did mount')
    if (this.state.content.content_id === -1) return // debug case

    this.loadContent()
    wysiwyg()
  }

  componentDidUpdate (prevProps, prevState) {
    console.log('HtmlDocument did update', prevState, this.state)
    if (!prevState.content || !this.state.content) return

    if (prevState.content.content_id !== this.state.content.content_id) {
      this.loadContent()
    }

    if (prevState.mode === MODE.VIEW && this.state.mode === MODE.EDIT) wysiwyg()
  }

  loadContent = async () => {
    const { content, config } = this.state

    const fetchResultHtmlDocument = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/html-documents/${content.content_id}`, { // ${content.workspace_id} ${content.content_id}
      ...FETCH_CONFIG,
      method: 'GET'
    })
    const fetchResultComment = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/comments`, { // ${content.workspace_id} ${content.content_id}
      ...FETCH_CONFIG,
      method: 'GET'
    })
    const fetchResultRevision = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/html-documents/${content.content_id}/revisions`, { // ${content.workspace_id} ${content.content_id}
      ...FETCH_CONFIG,
      method: 'GET'
    })

    handleFetchResult(fetchResultHtmlDocument)
      .then(resHtmlDocument => this.setState({content: resHtmlDocument.body}))
      .catch(e => console.log('Error loading content.', e))

    Promise.all([
      handleFetchResult(fetchResultComment),
      handleFetchResult(fetchResultRevision)
    ])
      .then(([resComment, resRevision]) => {
        const resCommentWithProperDate = resComment.body.map(c => ({...c, created: (new Date(c.created)).toLocaleString()}))
        const revisionWithComment = resRevision.body
          .map(r => ({
            ...r,
            created: (new Date(r.created)).toLocaleString(),
            timelineType: 'revision',
            commentList: r.comments_ids.map(ci => ({
              timelineType: 'comment',
              ...resCommentWithProperDate.find(c => c.content_id === ci)
            }))
          }))
          .reduce((acc, rev) => [
            ...acc,
            rev,
            ...rev.commentList.map(comment => ({
              ...comment,
              customClass: '',
              loggedUser: this.state.config.loggedUser
            }))
          ], [])

        console.log(revisionWithComment)

        this.setState({timeline: revisionWithComment})
      })
      .catch(e => {
        console.log('Error loading Timeline.', e)
        this.setState({timeline: []})
      })
  }

  saveEditHtmlDocument = (label, rawContent) =>
    fetch(`${this.state.config.apiUrl}/workspaces/${this.state.content.workspace_id}/html-documents/${this.state.content.content_id}`, {
      ...FETCH_CONFIG,
      method: 'PUT',
      body: JSON.stringify({
        label: label,
        raw_content: rawContent
      })
    })

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}})
  }

  handleSaveEditTitle = async newTitle => {
    const fetchResultSaveHtmlDoc = await this.saveEditHtmlDocument(newTitle, this.state.content.raw_content)

    handleFetchResult(fetchResultSaveHtmlDoc)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) this.loadContent()
        else console.warn('Error saving html-document. Result:', resSave, 'content:', this.state.content, 'config:', this.state.config)
      })
  }

  handleClickNewVersion = () => {
    this.setState({ mode: MODE.EDIT })
  }

  handleCloseNewVersion = () => {
    this.setState({ mode: MODE.VIEW })
  }

  handleSaveHtmlDocument = async () => {
    const { content, config } = this.state

    const fetchResultSaveHtmlDoc = await this.saveEditHtmlDocument(content.label, content.raw_content)

    handleFetchResult(fetchResultSaveHtmlDoc)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.handleCloseNewVersion()
          this.loadContent()
        } else {
          console.warn('Error saving html-document. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleChangeText = e => {
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity
    this.setState(prev => ({content: {...prev.content, raw_content: newText}}))
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({newComment})
  }

  handleClickValidateNewCommentBtn = async () => {
    const { config, content, newComment } = this.state

    const fetchResultSaveNewComment = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/comments`, {
      ...FETCH_CONFIG,
      method: 'POST',
      body: JSON.stringify({
        raw_content: newComment
      })
    })

    handleFetchResult(fetchResultSaveNewComment)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.setState({newComment: ''})
          this.loadContent()
        } else {
          console.warn('Error saving html-document comment. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleChangeStatus = async newStatus => {
    const { config, content } = this.state

    const fetchResultSaveEditStatus = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/html-documents/${content.content_id}/status`, {
      ...FETCH_CONFIG,
      method: 'PUT',
      body: JSON.stringify({
        status: newStatus
      })
    })

    handleFetchResult(fetchResultSaveEditStatus)
      .then(resSave => {
        if (resSave.status !== 204) { // 204 no content so dont take status from resSave.apiResponse.status
          console.warn('Error saving html-document comment. Result:', resSave, 'content:', content, 'config:', config)
        } else {
          this.loadContent()
        }
      })
  }

  handleClickArchive = async () => {
    console.log('archive')
    // const { config, content } = this.state
    //
    // const fetchResultArchive = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/archive`, {
    //   ...FETCH_CONFIG,
    //   method: 'PUT'
    // })
  }
  handleClickDelete = async () => {
    console.log('delete')
    // const { config, content } = this.state
    // const fetchResultDelete = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/delete`, {
    //   ...FETCH_CONFIG,
    //   method: 'PUT'
    // })
  }

  render () {
    const { isVisible, loggedUser, content, timeline, newComment, config } = this.state

    if (!isVisible) return null

    return (
      <PopinFixed customClass={`${config.slug}`}>
        <PopinFixedHeader
          customClass={`${config.slug}`}
          faIcon={config.faIcon}
          title={content.label}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
        />

        <PopinFixedOption
          customClass={`${config.slug}`}
          availableStatus={config.availableStatuses}
          onClickNewVersionBtn={this.handleClickNewVersion}
          onChangeStatus={this.handleChangeStatus}
          selectedStatus={config.availableStatuses.find(s => s.slug === content.status)} // peut être vide avant que api reponde
          onClickArchive={this.handleClickArchive}
          onClickDelete={this.handleClickDelete}
          i18n={i18n}
        />

        <PopinFixedContent customClass={`${config.slug}__contentpage`}>
          <HtmlDocumentComponent
            mode={this.state.mode}
            onClickCloseEditMode={this.handleCloseNewVersion}
            onClickValidateBtn={this.handleSaveHtmlDocument}
            version={timeline.filter(t => t.timelineType === 'revision').length}
            text={content.raw_content}
            onChangeText={this.handleChangeText}
            key={'html-documents'}
          />

          <Timeline
            customClass={`${config.slug}__contentpage`}
            loggedUser={loggedUser}
            timelineData={timeline}
            newComment={newComment}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default HtmlDocument
