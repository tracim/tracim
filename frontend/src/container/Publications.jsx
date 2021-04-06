import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  formatAbsoluteDate,
  appContentFactory,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CommentTextArea,
  ConfirmPopup,
  CUSTOM_EVENT,
  getContentComment,
  getFileChildContent,
  getOrCreateSessionClientToken,
  handleFetchResult,
  handleInvalidMentionInComment,
  IconButton,
  PAGE,
  ROLE,
  ROLE_LIST,
  ScrollToBottomWrapper,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  TRANSLATION_STATE,
  isFileUploadInErrorState,
  CONTENT_TYPE,
  AddFileToUploadButton,
  DisplayFileToUpload,
  getFileDownloadUrl
} from 'tracim_frontend_lib'
import {
  CONTENT_NAMESPACE,
  FETCH_CONFIG,
  findUserRoleIdInWorkspace,
  handleClickCopyLink,
  publicationColor
} from '../util/helper.js'
import {
  getPublicationList,
  getWorkspaceDetail,
  getWorkspaceMemberList,
  postThreadPublication,
  postPublicationFile
} from '../action-creator.async.js'
import {
  setCommentListToPublication,
  appendPublication,
  newFlashMessage,
  removePublication,
  setBreadcrumbs,
  setHeadTitle,
  setPublicationList,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  updatePublication,
  updatePublicationList
} from '../action-creator.sync.js'

import TabBar from '../component/TabBar/TabBar.jsx'
import FeedItemWithPreview, { LINK_TYPE } from './FeedItemWithPreview.jsx'

const wysiwygId = 'wysiwygTimelineCommentPublication'

export class Publications extends React.Component {
  constructor (props) {
    super(props)
    props.setApiUrl(FETCH_CONFIG.apiUrl)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreatedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreatedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreatedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreatedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommented },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCommentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCommented }
    ])

    // NOTE - SG - 2021-03-25 - This will be set to the DOM element
    // of the current publication coming from the URL (if any)
    this.currentPublicationRef = null
    this.state = {
      isLastItemAddedFromCurrentToken: false,
      invalidMentionList: [],
      newComment: '',
      newCommentAsFileList: [],
      publicationWysiwyg: false,
      showInvalidMentionPopupInComment: false,
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
      globalThis.tinymce.remove(`#${wysiwygId}`)
    }
    if (props.currentWorkspace.memberList.length === 0) this.loadMemberList()
    if (this.currentPublicationRef && this.currentPublicationRef.current) {
      this.currentPublicationRef.current.scrollIntoView({ behavior: 'instant' })
      // Remove the ref as it has fulfilled its role
      this.currentPublicationRef = null
    }
  }

  componentWillUnmount () {
    globalThis.tinymce.remove(`#${wysiwygId}`)
  }

  handleAllAppChangeLanguage = (data) => {
    if (this.state.publicationWysiwyg) {
      globalThis.tinymce.remove(`#${wysiwygId}`)
      globalThis.wysiwyg(`#${wysiwygId}`, data, this.handleChangeNewPublication)
    }
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  handleContentCommentModified = (data) => {
    const { props } = this
    const parentPublication = props.publicationList.find(publication => publication.id === data.fields.content.parent_id)

    if (!parentPublication) return

    const newTimeline = props.updateCommentOnTimeline(
      data.fields.content,
      parentPublication.commentList || [],
      props.user.username
    )
    props.dispatch(setCommentListToPublication(parentPublication.id, newTimeline))
  }

  handleContentCommentDeleted = (data) => {
    const { props } = this
    const parentPublication = props.publicationList.find(publication => publication.id === data.fields.content.parent_id)

    if (!parentPublication) return

    const newTimeline = props.removeCommentFromTimeline(
      data.fields.content.content_id,
      parentPublication.commentList || []
    )
    props.dispatch(setCommentListToPublication(parentPublication.id, newTimeline))
  }

  handleClickPublish = () => {
    const { props, state } = this

    if (!handleInvalidMentionInComment(
      props.currentWorkspace.memberList,
      state.publicationWysiwyg,
      state.newComment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnyway()
    }
  }

  handleContentCreatedOrRestored = (data) => {
    if (data.fields.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION) return
    if (data.fields.content.parent_id !== null) return
    this.setState({ isLastItemAddedFromCurrentToken: data.fields.client_token === getOrCreateSessionClientToken() })
    this.props.dispatch(appendPublication(data.fields.content))
  }

  handleContentCommented = (data) => {
    const { props } = this
    const lastPublicationId = props.publicationList[props.publicationList.length - 1]
      ? props.publicationList[props.publicationList.length - 1].id
      : undefined
    const parentPublication = props.publicationList.find(publication => publication.id === data.fields.content.parent_id)

    // INFO - G.B. - 2021-03-19 - First check if the comment was made in a publication, then check if
    // this publication doesn't have a loaded comment list, if there is the case we load the whole list
    // with this comment included, so we does not need to continue the function
    if (!parentPublication) return

    if (!parentPublication.commentList) {
      this.getCommentList(parentPublication.id, parentPublication.type)
      return
    }

    const hasBeenRead = true
    const newTimeline = props.addCommentToTimeline(
      data.fields.content, parentPublication.commentList, props.user, hasBeenRead, TRANSLATION_STATE.DISABLED
    )

    props.dispatch(setCommentListToPublication(parentPublication.id, newTimeline))
    props.dispatch(updatePublication({
      ...parentPublication,
      modified: data.fields.content.created
    }))

    if (parentPublication.id !== lastPublicationId) this.setState({ showReorderButton: true })
  }

  handleContentModified = (data) => {
    const { props } = this
    if (data.fields.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION) return

    props.dispatch(updatePublication(data.fields.content))

    const lastPublicationId = props.publicationList[props.publicationList.length - 1].id
    if (data.fields.content.content_id !== lastPublicationId) this.setState({ showReorderButton: true })
  }

  handleContentDeleted = (data) => {
    if (data.fields.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION) return
    this.props.dispatch(removePublication(data.fields.content.content_id))
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
      default:
        props.dispatch(newFlashMessage(
          `${props.t('An error has happened while getting')} ${props.t('space detail')}`,
          'warning'
        ))
        break
    }
  }

  handleInitPublicationWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      `#${wysiwygId}`,
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
    const publicationId = props.match.params.idcts
    const myLink = publicationId
      ? PAGE.WORKSPACE.PUBLICATION(workspaceId, publicationId)
      : PAGE.WORKSPACE.PUBLICATIONS(workspaceId)
    const breadcrumbsList = [
      {
        link: PAGE.WORKSPACE.DASHBOARD(workspaceId),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.currentWorkspace.label,
        isALink: true
      },
      {
        link: myLink,
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
    const workspaceId = props.match.params.idws
    const fetchGetPublicationList = await props.dispatch(getPublicationList(workspaceId))
    switch (fetchGetPublicationList.status) {
      case 200: {
        fetchGetPublicationList.json.items.forEach(publication => this.getCommentList(publication.content_id, publication.content_type))
        props.dispatch(setPublicationList(fetchGetPublicationList.json.items))
        break
      }
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('publication list')}`, 'warning')); break
    }
  }

  getCommentList = async (publicationId, publicationContentType) => {
    const { props } = this
    const workspaceId = props.match.params.idws

    const [resComment, resCommentAsFile] = await Promise.all([
      handleFetchResult(await getContentComment(FETCH_CONFIG.apiUrl, workspaceId, publicationId)),
      handleFetchResult(await getFileChildContent(FETCH_CONFIG.apiUrl, workspaceId, publicationId))
    ])

    if (resComment.apiResponse.status !== 200 || resCommentAsFile.apiResponse.status !== 200) {
      props.dispatch(newFlashMessage(`${props.t('Error loading publication comments')}`, 'warning'))
      return
    }

    const commentList = props.buildTimelineFromCommentAndRevision(
      resComment.body,
      resCommentAsFile.body.items,
      [], // INFO - CH - 20210324 - this is supposed to be the revision list which we don't have for publications
      props.user,
      TRANSLATION_STATE.DISABLED
    )

    // INFO - G.B. - 2021-03-19 - For threads, we remove the first element because it's already shown in the preview
    const finalCommentList = publicationContentType === CONTENT_TYPE.FILE ? commentList : commentList.slice(1)

    props.dispatch(setCommentListToPublication(publicationId, finalCommentList))
  }

  handleChangeNewPublication = e => this.setState({ newComment: e.target.value })

  handleAddCommentAsFile = fileToUploadList => {
    this.props.appContentAddCommentAsFile(fileToUploadList, this.setState.bind(this))
  }

  handleRemoveCommentAsFile = fileToRemove => {
    this.props.appContentRemoveCommentAsFile(fileToRemove, this.setState.bind(this))
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

  buildPublicationName = (authorName, userLang) => {
    const { props } = this

    return props.t('Publication of {{author}} on {{date}}', {
      author: props.user.publicName,
      date: formatAbsoluteDate(new Date(), userLang),
      interpolation: { escapeValue: false }
    })
  }

  saveThreadPublication = async () => {
    const { props, state } = this

    const workspaceId = props.match.params.idws
    const publicationName = this.buildPublicationName(props.user.publicName, props.user.lang)

    const fetchPostPublication = await props.dispatch(postThreadPublication(workspaceId, publicationName))

    if (fetchPostPublication.status !== 200) {
      props.dispatch(newFlashMessage(`${props.t('Error while saving new publication')}`, 'warning'))
      return
    }

    try {
      props.appContentSaveNewComment(
        fetchPostPublication.json,
        state.publicationWysiwyg,
        state.newComment,
        [],
        this.setState.bind(this),
        '',
        props.user.username,
        'Publication'
      )
    } catch (e) {
      props.dispatch(newFlashMessage(e.message || props.t('Error while saving the comment')))
    }
  }

  processSaveFilePublication = async () => {
    const { props, state } = this

    const workspaceId = props.match.params.idws
    const publicationName = this.buildPublicationName(props.user.publicName, props.user.lang)

    if (state.newCommentAsFileList.length !== 1) return

    const fileToUpload = state.newCommentAsFileList[0]
    const fetchPostPublicationFile = await props.dispatch(postPublicationFile(workspaceId, fileToUpload, publicationName))

    const isUploadInError = isFileUploadInErrorState(fetchPostPublicationFile)
    if (isUploadInError) {
      props.dispatch(newFlashMessage(fetchPostPublicationFile.errorMessage, 'warning'))
      this.setState({ newCommentAsFileList: [fetchPostPublicationFile] })
      return
    }

    if (state.newComment !== '') {
      try {
        props.appContentSaveNewComment(
          fetchPostPublicationFile.responseJson,
          state.publicationWysiwyg,
          state.newComment,
          [],
          this.setState.bind(this),
          fetchPostPublicationFile.responseJson.slug,
          props.user.username,
          fetchPostPublicationFile.responseJson.content_id
        )
      } catch (e) {
        props.dispatch(newFlashMessage(e.message || props.t('Error while saving the comment')))
      }
    }

    if (state.publicationWysiwyg) globalThis.tinymce.get(wysiwygId).setContent('')
    this.setState({
      newComment: '',
      newCommentAsFileList: []
    })
  }

  handleClickValidateAnyway = async () => {
    const { state } = this

    if (state.newComment !== '' && state.newCommentAsFileList.length === 0) {
      this.saveThreadPublication()
    }

    if (state.newCommentAsFileList.length > 0) {
      this.processSaveFilePublication()
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
    this.setState({ showReorderButton: false })
  }

  searchForMentionInQuery = async (query) => {
    return await this.props.searchForMentionInQuery(query, this.props.match.params.idws)
  }

  getPreviewLinkParameters = (publication) => {
    const previewLinkType = publication.type === CONTENT_TYPE.FILE
      ? LINK_TYPE.DOWNLOAD
      : LINK_TYPE.OPEN_IN_APP

    const previewLink = publication.type === CONTENT_TYPE.FILE
      ? getFileDownloadUrl(FETCH_CONFIG.apiUrl, publication.workspaceId, publication.id, publication.fileName)
      : PAGE.WORKSPACE.CONTENT(publication.workspaceId, publication.type, publication.id)
    return { previewLinkType, previewLink }
  }

  render () {
    const { props, state } = this
    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, props.currentWorkspace.memberList, ROLE_LIST)
    const currentPublicationId = Number(props.match.params.idcts || 0)
    this.currentPublicationRef = currentPublicationId ? React.createRef() : null
    return (
      <div className='publications'>
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />

        <ScrollToBottomWrapper
          customClass='pageContentGeneric'
          isLastItemAddedFromCurrentToken={state.isLastItemAddedFromCurrentToken}
          itemList={props.publicationList}
          shouldScrollToBottom={currentPublicationId === 0}
        >
          {props.publicationList.map(publication =>
            <FeedItemWithPreview
              available
              commentList={publication.commentList}
              content={publication}
              customColor={publicationColor}
              key={`publication_${publication.id}`}
              ref={publication.id === currentPublicationId ? this.currentPublicationRef : undefined}
              memberList={props.currentWorkspace.memberList}
              onClickCopyLink={() => this.handleClickCopyLink(publication)}
              isPublication
              inRecentActivities={false}
              showTimeline
              user={{
                userId: props.user.userId,
                username: props.user.username,
                name: props.user.publicName,
                userRoleIdInWorkspace: userRoleIdInWorkspace
              }}
              workspaceId={Number(publication.workspaceId)}
              {...this.getPreviewLinkParameters(publication)}
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

          {state.showInvalidMentionPopupInComment && (
            <ConfirmPopup
              onConfirm={this.handleCancelSave}
              onClose={this.handleCancelSave}
              onCancel={this.handleClickValidateAnyway}
              msg={
                <>
                  {props.t('Your text contains mentions that do not match any member of this space:')}
                  <div className='timeline__texteditor__mentions'>
                    {state.invalidMentionList.join(', ')}
                  </div>
                </>
              }
              confirmLabel={props.t('Edit')}
              cancelLabel={props.t('Validate anyway')}
            />
          )}

          {userRoleIdInWorkspace >= ROLE.contributor.id && (
            <div className='publications__publishArea'>
              <CommentTextArea
                apiUrl={FETCH_CONFIG.apiUrl}
                id={wysiwygId}
                newComment={state.newComment}
                onChangeNewComment={this.handleChangeNewPublication}
                onInitWysiwyg={this.handleInitPublicationWysiwyg}
                searchForMentionInQuery={this.searchForMentionInQuery}
                wysiwyg={state.publicationWysiwyg}
                disableAutocompletePosition
              />

              <div className='publications__publishArea__buttons'>
                <div className='publications__publishArea__buttons__left'>
                  <IconButton
                    customClass='publications__publishArea__buttons__left__advancedEdition'
                    intent='link'
                    mode='light'
                    onClick={this.handleToggleWysiwyg}
                    text={state.publicationWysiwyg ? props.t('Simple edition') : props.t('Advanced edition')}
                  />

                  <div>
                    <DisplayFileToUpload
                      fileList={state.newCommentAsFileList}
                      onRemoveCommentAsFile={this.handleRemoveCommentAsFile}
                      color={publicationColor}
                    />
                  </div>
                </div>

                <div className='publications__publishArea__buttons__right'>
                  <div>
                    <AddFileToUploadButton
                      workspaceId={props.currentWorkspace.id}
                      color={publicationColor}
                      disabled={state.newCommentAsFileList.length > 0}
                      multipleFiles={false}
                      onValidateCommentFileToUpload={this.handleAddCommentAsFile}
                    />
                  </div>

                  <IconButton
                    customClass='publications__publishArea__buttons__submit'
                    color={publicationColor}
                    disabled={state.newComment === '' && state.newCommentAsFileList.length === 0}
                    intent='primary'
                    mode='light'
                    onClick={this.handleClickPublish}
                    icon='far fa-paper-plane'
                    text={props.t('Publish')}
                    title={props.t('Publish')}
                  />
                </div>
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
export default connect(mapStateToProps)(withRouter(translate()(appContentFactory(TracimComponent(Publications)))))
