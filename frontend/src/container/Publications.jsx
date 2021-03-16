import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CommentTextArea,
  CUSTOM_EVENT,
  getOrCreateSessionClientToken,
  IconButton,
  PAGE,
  postNewComment,
  ROLE,
  ROLE_LIST,
  ScrollToBottomWrapper,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  FETCH_CONFIG,
  findUserRoleIdInWorkspace,
  handleClickCopyLink
} from '../util/helper.js'
import {
  getPublicationList,
  getWorkspaceDetail,
  getWorkspaceMemberList,
  postThreadPublication
} from '../action-creator.async.js'
import {
  appendPublication,
  newFlashMessage,
  removePublication,
  setBreadcrumbs,
  setHeadTitle,
  setPublicationList,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  updatePublicationList
} from '../action-creator.sync.js'

import TabBar from '../component/TabBar/TabBar.jsx'
import { FeedItemWithPreview } from '../component/FeedItem/FeedItemWithPreview.jsx'

export class Publications extends React.Component {
  constructor (props) {
    super(props)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreatedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreatedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommented }
    ])

    this.state = {
      newPublication: '',
      publicationList: [],
      publicationWysiwyg: false,
      showReorderButton: false
    }
  }

  componentDidMount () {
    this.loadWorkspaceDetail()
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.getPublicationList()
    if (this.props.currentWorkspace.memberList.length === 0) this.loadMemberList()
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this
    if (prevProps.match.params.idws !== props.match.params.idws) {
      this.loadWorkspaceDetail()
      this.setHeadTitle()
      this.buildBreadcrumbs()
      this.getPublicationList()
    }
    if (prevState.publicationWysiwyg && !state.publicationWysiwyg) {
      globalThis.tinymce.remove('#wysiwygPublication')
    }
    if (props.currentWorkspace.memberList.length === 0) this.loadMemberList()
  }

  componentWillUnmount () {
    globalThis.tinymce.remove('#wysiwygPublication')
  }

  sortByModifiedDate = (arrayToSort) => {
    return arrayToSort.sort(function (a, b) {
      if (a.modified > b.modified) return 1
      if (a.modified < b.modified) return -1
      return 0
    })
  }

  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  handleContentCreatedOrRestored = (data) => {
    if (data.fields.content.content_namespace !== 'publication') return
    if (data.fields.client_token === getOrCreateSessionClientToken()) return
    this.props.dispatch(appendPublication(data.fields.content))
    const newPublicationList = this.state.publicationList
    newPublicationList.push(data.fields.content)
    this.setState({ publicationList: this.sortByModifiedDate(newPublicationList) })
  }

  handleContentCommented = (data) => {
    const lastPublicationId = this.state.publicationList[this.state.publicationList.length - 1].content_id
    if (data.fields.content.parent_id === lastPublicationId) return
    // this.setState({ showReorderButton: true }) Update
  }

  handleContentModified = (data) => {
    const lastPublicationId = this.state.publicationList[this.state.publicationList.length - 1].content_id
    if (data.fields.content.content_namespace !== 'publication' || data.fields.content.content_id === lastPublicationId) return
    this.setState({ showReorderButton: true })
  }

  handleContentDeleted = (data) => {
    if (data.fields.content.content_namespace !== 'publication') return
    this.props.dispatch(removePublication(data.fields.content.content_id))
    const newPublicationList = this.state.publicationList.filter(publication => data.fields.content.content_id !== publication.content_id)
    this.setState({ publicationList: this.sortByModifiedDate(newPublicationList) })
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.match.params.idws))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        this.setHeadTitle()
        this.buildBreadcrumbs()
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage(props.t('Unknown space')))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  handleInitPublicationWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      '#wysiwygPublication',
      this.props.user.lang,
      this.handleChangeNewPublication,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ publicationWysiwyg: !prev.publicationWysiwyg }))

  buildBreadcrumbs = () => {
    const { props } = this
    const workspaceId = props.match.params.idws
    const breadcrumbsList = [
      {
        link: PAGE.WORKSPACE.DASHBOARD(workspaceId),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.currentWorkspace.label,
        isALink: true
      },
      {
        link: PAGE.WORKSPACE.PUBLICATION(workspaceId),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.t('Publications'),
        isALink: false
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle(
      [props.t('Publications'), props.currentWorkspace.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  getPublicationList = async () => {
    const { props } = this

    const fetchGetPublicationList = await props.dispatch(getPublicationList(props.match.params.idws))
    switch (fetchGetPublicationList.status) {
      case 200:
        props.dispatch(setPublicationList(fetchGetPublicationList.json))
        this.setState({ publicationList: this.sortByModifiedDate(fetchGetPublicationList.json) })
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('publication list')}`, 'warning')); break
    }
  }

  handleChangeNewPublication = e => this.setState({ newPublication: e.target.value })

  handleClickPublish = async () => {
    const { props, state } = this
    const workspaceId = props.match.params.idws
    const randomNumber = uuidv4()

    const fetchPostThreadPublication = await props.dispatch(postThreadPublication(
      workspaceId,
      `thread_${randomNumber}`
    ))

    switch (fetchPostThreadPublication.status) {
      case 200: {
        const fetchPostNewComment = await postNewComment(
          FETCH_CONFIG.apiUrl,
          workspaceId,
          fetchPostThreadPublication.json.content_id,
          state.newPublication
        )
        switch (fetchPostNewComment.status) {
          case 200: {
            props.dispatch(appendPublication(fetchPostThreadPublication.json))
            const newPublicationList = state.publicationList
            newPublicationList.push(fetchPostThreadPublication.json)
            this.setState({
              publicationList: newPublicationList,
              newPublication: ''
            })
            break
          }
          default:
            props.dispatch(newFlashMessage(`${props.t('Error while saving new comment')}`, 'warning'))
            break
        }
        break
      }
      default:
        props.dispatch(newFlashMessage(`${props.t('Error while saving new publication')}`, 'warning'))
        break
    }
  }

  handleClickCopyLink = content => {
    const { props } = this
    handleClickCopyLink(content)
    props.dispatch(newFlashMessage(props.t('The link has been copied to clipboard'), 'info'))
  }

  loadMemberList = async () => {
    const { props } = this

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(props.match.params.idws))
    switch (fetchWorkspaceMemberList.status) {
      case 200: props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json)); break
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('member list')}`, 'warning')); break
    }
  }

  handleClickReorder = () => {
    this.props.dispatch(updatePublicationList())
  }

  render () {
    const { props, state } = this
    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, props.currentWorkspace.memberList, ROLE_LIST)
    const publicationColor = '#661F98'

    return (
      <div className='publications'>
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />

        <ScrollToBottomWrapper
          itemList={state.publicationList}
          customClass='pageContentGeneric'
          // isLastItemFromCurrentToken: PropTypes.bool,
          shouldScrollToBottom
        >
          {state.publicationList.map(publication =>
            <FeedItemWithPreview
              key={`publication_${publication.content_id}`}
              content={publication}
              onClickCopyLink={() => this.handleClickCopyLink(publication)}
              workspaceId={Number(publication.workspace_id)}
            />
          )}

          {state.showReorderButton && (
            <IconButton
              customClass='publications__reorder'
              text={props.t('Reorder')}
              icon='fas fa-redo-alt'
              intent='link'
              onClick={this.handleClickReorder}
            />
          )}

          {userRoleIdInWorkspace >= ROLE.contributor.id && (
            <div className='publications__publishArea'>
              <CommentTextArea
                apiUrl={FETCH_CONFIG.apiUrl}
                id='wysiwygPublication'
                newComment={state.newPublication}
                onChangeNewComment={this.handleChangeNewPublication}
                onInitWysiwyg={this.handleInitPublicationWysiwyg}
                searchForMentionInQuery={() => { }} // Update
                wysiwyg={state.publicationWysiwyg}
              />

              <div className='publications__publishArea__buttons'>
                <IconButton
                  customClass='publications__publishArea__buttons__advancedEdition'
                  intent='link'
                  mode='light'
                  onClick={this.handleToggleWysiwyg}
                  text={state.publicationWysiwyg ? props.t('Simple edition') : props.t('Advanced edition')}
                />

                <IconButton
                  color={publicationColor}
                  disabled={state.newPublication === ''}
                  intent='primary'
                  mode='light'
                  onClick={this.handleClickPublish}
                  text={<span>{props.t('Publish')}&nbsp;<i className='far fa-paper-plane' /></span>}
                  title={props.t('Publish')}
                />
              </div>
            </div>
          )}
        </ScrollToBottomWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({
  breadcrumbs,
  currentWorkspace,
  publicationList,
  user
}) => ({ breadcrumbs, currentWorkspace, publicationList, user })
export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(Publications))))
