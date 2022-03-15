import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  formatAbsoluteDate,
  appContentFactory,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CommentArea,
  CUSTOM_EVENT,
  EditCommentPopup,
  getContentComment,
  getFileChildContent,
  getOrCreateSessionClientToken,
  handleFetchResult,
  handleInvalidMentionInComment,
  tinymceRemove,
  IconButton,
  Loading,
  PAGE,
  ROLE,
  ROLE_LIST,
  COLORS,
  ScrollToBottomWrapper,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  TRANSLATION_STATE,
  isFileUploadInErrorState,
  CONTENT_TYPE,
  getFileDownloadUrl,
  NUMBER_RESULTS_BY_PAGE,
  LOCAL_STORAGE_FIELD,
  setLocalStorageItem
} from 'tracim_frontend_lib'
import {
  CONTENT_NAMESPACE,
  FETCH_CONFIG,
  findUserRoleIdInWorkspace,
  handleClickCopyLink
} from '../util/helper.js'
import {
  getPublicationPage,
  postThreadPublication,
  postPublicationFile
} from '../action-creator.async.js'
import {
  appendPublication,
  newFlashMessage,
  removePublication,
  setBreadcrumbs,
  setCommentListToPublication,
  setHeadTitle,
  setFirstComment,
  setPublicationList,
  setPublicationNextPage,
  updatePublication,
  updatePublicationList,
  appendPublicationList
} from '../action-creator.sync.js'

import TabBar from '../component/TabBar/TabBar.jsx'
import FeedItemWithPreview, { LINK_TYPE } from './FeedItemWithPreview.jsx'

const wysiwygId = 'wysiwygTimelineCommentPublication'
// INFO - G.B. - 2021-10-18 - The value below is used only for local storage, it's a fake id for the
// publication that is being written but has not been sent yet (i.e. does not have an id)
const newPublicationId = -5

const PUBLICATION_ITEM_COUNT_PER_PAGE = NUMBER_RESULTS_BY_PAGE

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
    this.currentPublicationRef = React.createRef()
    this.state = {
      loading: true,
      commentToEdit: {},
      newCurrentPublication: !!this.props.match.params.idcts,
      isLastItemAddedFromCurrentToken: false,
      invalidMentionList: [],
      publicationWysiwyg: false,
      showEditPopup: false,
      showInvalidMentionPopupInComment: false,
      showReorderButton: false
    }
  }

  async componentDidMount () {
    this.setHeadTitle()
    this.buildBreadcrumbs()
    if (this.props.currentWorkspace.id) {
      await this.getPublicationPage()
      this.gotToCurrentPublication()
    }
  }

  gotToCurrentPublication () {
    if (!this.props.match.params.idcts) return

    if (this.currentPublicationRef.current) {
      this.setState({ newCurrentPublication: false })
      this.currentPublicationRef.current.scrollIntoView({ behavior: 'instant' })
    } else if (!this.state.newCurrentPublication) {
      this.setState({ newCurrentPublication: true })
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    const { props, state } = this
    if (prevProps.currentWorkspace.id !== props.currentWorkspace.id) {
      this.setHeadTitle()
      this.buildBreadcrumbs()
      await this.getPublicationPage()
      this.gotToCurrentPublication()
    }

    if (prevState.publicationWysiwyg && !state.publicationWysiwyg) {
      tinymceRemove(`#${wysiwygId}`)
    }

    if (prevProps.match.params.idcts !== props.match.params.idcts || state.newCurrentPublication) {
      this.gotToCurrentPublication()
    }
  }

  componentWillUnmount () {
    tinymceRemove(`#${wysiwygId}`)
  }

  handleAllAppChangeLanguage = (data) => {
    if (this.state.publicationWysiwyg) {
      tinymceRemove(`#${wysiwygId}`)
      globalThis.wysiwyg(`#${wysiwygId}`, data, this.handleChangeNewPublication)
    }
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  handleContentCommentModified = (data) => {
    const { props } = this
    const parentPublication = props.publicationPage.list.find(publication => publication.id === data.fields.content.parent_id)

    if (!parentPublication) return

    if (parentPublication.firstComment && data.fields.content.content_id === parentPublication.firstComment.content_id) {
      props.dispatch(updatePublication({ ...parentPublication, firstComment: data.fields.content }))
      return
    }

    const newTimeline = props.updateCommentOnTimeline(
      data.fields.content,
      parentPublication.commentList || [],
      props.user.username
    )
    props.dispatch(setCommentListToPublication(parentPublication.id, newTimeline))
  }

  handleContentCommentDeleted = (data) => {
    const { props } = this
    const parentPublication = props.publicationPage.list.find(publication => publication.id === data.fields.content.parent_id)

    if (!parentPublication) return

    const newTimeline = (parentPublication.commentList || []).filter(it => it.content_id !== data.fields.content.content_id)
    props.dispatch(setCommentListToPublication(parentPublication.id, newTimeline))
  }

  handleClickPublish = (publication, publicationAsFileList) => {
    const { props, state } = this

    if (!handleInvalidMentionInComment(
      props.currentWorkspace.memberList,
      state.publicationWysiwyg,
      publication,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnyway(publication, publicationAsFileList)
      return true
    }
    return false
  }

  handleContentCreatedOrRestored = (data) => {
    if (
      data.fields.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION ||
      data.fields.content.parent_id !== null ||
      data.fields.content.workspace_id !== this.props.currentWorkspace.id
    ) return
    this.setState({ isLastItemAddedFromCurrentToken: data.fields.client_token === getOrCreateSessionClientToken() })
    this.props.dispatch(appendPublication(data.fields.content))
  }

  handleContentCommented = (data) => {
    const { props } = this
    const lastPublicationId = props.publicationPage.list[props.publicationPage.list.length - 1]
      ? props.publicationPage.list[props.publicationPage.list.length - 1].id
      : undefined
    const parentPublication = props.publicationPage.list.find(publication => publication.id === data.fields.content.parent_id)

    // INFO - G.B. - 2021-03-19 - First check if the comment was made in a publication, then check if
    // this publication doesn't have a loaded comment list, if there is the case we load the whole list
    // with this comment included, so we does not need to continue the function
    if (!parentPublication) return

    if (!parentPublication.commentList) {
      this.getCommentList(parentPublication.id, parentPublication.type)
      return
    }

    const timelineItem = props.buildChildContentTimelineItem(
      data.fields.content, parentPublication.commentList, props.user, TRANSLATION_STATE.DISABLED
    )
    const newTimeline = [...parentPublication.commentList, timelineItem]

    props.dispatch(setCommentListToPublication(parentPublication.id, newTimeline))
    props.dispatch(updatePublication({
      ...parentPublication,
      modified: data.fields.content.created
    }))

    // RJ - NOTE - 2021-04-09 - We don't want to scroll for any arriving comment,
    // even if it is ours
    this.setState({ isLastItemAddedFromCurrentToken: false })

    if (parentPublication.id !== lastPublicationId) this.setState({ showReorderButton: true })
  }

  handleContentModified = (data) => {
    const { props } = this
    if (data.fields.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION) return

    props.dispatch(updatePublication(data.fields.content))

    const lastPublicationId = props.publicationPage.list[props.publicationPage.list.length - 1].id
    if (data.fields.content.content_id !== lastPublicationId) this.setState({ showReorderButton: true })
  }

  handleContentDeleted = (data) => {
    if (data.fields.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION) return
    this.props.dispatch(removePublication(data.fields.content.content_id))
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ publicationWysiwyg: !prev.publicationWysiwyg }))

  buildBreadcrumbs = () => {
    const { props } = this
    const workspaceId = props.currentWorkspace.id
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
        label: props.t('News'),
        isALink: false
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle(
      [props.t('News'), props.currentWorkspace.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  getPublicationPage = async (pageToken = '') => {
    const { props } = this
    this.setState({ loading: true })
    const workspaceId = props.currentWorkspace.id
    const fetchGetPublicationList = await props.dispatch(getPublicationPage(workspaceId, PUBLICATION_ITEM_COUNT_PER_PAGE, pageToken))
    switch (fetchGetPublicationList.status) {
      case 200: {
        fetchGetPublicationList.json.items.forEach(publication => this.getCommentList(publication.content_id, publication.content_type))
        const reduxAction = pageToken.length > 0 ? appendPublicationList : setPublicationList
        props.dispatch(reduxAction(fetchGetPublicationList.json.items))
        props.dispatch(setPublicationNextPage(fetchGetPublicationList.json.has_next, fetchGetPublicationList.json.next_page_token))
        break
      }
      default:
        props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('publication list')}`, 'warning'))
        break
    }
    this.setState({ loading: false })
  }

  getCommentList = async (publicationId, publicationContentType) => {
    const { props } = this
    const workspaceId = props.currentWorkspace.id

    const [resComment, resCommentAsFile] = await Promise.all([
      handleFetchResult(await getContentComment(FETCH_CONFIG.apiUrl, workspaceId, publicationId)),
      handleFetchResult(await getFileChildContent(FETCH_CONFIG.apiUrl, workspaceId, publicationId))
    ])

    if (resComment.apiResponse.status !== 200 || resCommentAsFile.apiResponse.status !== 200) {
      props.dispatch(newFlashMessage(`${props.t('Error loading publication comments')}`, 'warning'))
      return
    }

    const commentList = props.buildTimelineFromCommentAndRevision(
      resComment.body.items,
      resCommentAsFile.body.items,
      [], // INFO - CH - 20210324 - this is supposed to be the revision list which we don't have for publications
      props.user,
      TRANSLATION_STATE.DISABLED
    )

    // INFO - G.B. - 2021-03-19 - For threads, we remove the first element because it's already shown in the preview
    const finalCommentList = publicationContentType === CONTENT_TYPE.FILE ? commentList : commentList.slice(1)

    props.dispatch(setCommentListToPublication(publicationId, finalCommentList))
    if (publicationContentType === CONTENT_TYPE.THREAD) {
      props.dispatch(setFirstComment(publicationId, commentList[0]))
    }
  }

  handleChangeNewPublication = e => this.setState({ newComment: e.target.value })

  handleClickEdit = (publication) => {
    this.setState({ showEditPopup: true, commentToEdit: publication.firstComment })
  }

  handleClickValidateEdit = (publication) => {
    const { props } = this
    if (!handleInvalidMentionInComment(
      props.currentWorkspace.memberList,
      true,
      publication,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnywayEdit()
    }
  }

  handleClickValidateAnywayEdit = () => {
    this.setState({
      invalidMentionList: [],
      showEditPopup: false,
      showInvalidMentionPopupInComment: false
    })
    this.handleEditPublication()
  }

  handleEditPublication = () => {
    const { props, state } = this
    props.appContentEditComment(
      props.currentWorkspace.id,
      state.commentToEdit.parent_id,
      state.commentToEdit.content_id,
      props.user.username
    )
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

  buildPublicationName = (authorName, userLang) => {
    const { props } = this

    return props.t('News of {{author}} on {{date}}', {
      author: authorName,
      date: formatAbsoluteDate(new Date(), userLang),
      interpolation: { escapeValue: false }
    })
  }

  saveThreadPublication = async (publication) => {
    const { props, state } = this

    const workspaceId = props.currentWorkspace.id
    const publicationName = this.buildPublicationName(props.user.publicName, props.user.lang)

    const fetchPostPublication = await props.dispatch(postThreadPublication(workspaceId, publicationName))

    if (fetchPostPublication.status !== 200) {
      props.dispatch(newFlashMessage(`${props.t('Error while saving new news')}`, 'warning'))
      return
    }

    try {
      props.appContentSaveNewComment(
        fetchPostPublication.json,
        state.publicationWysiwyg,
        publication,
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

  processSaveFilePublication = async (publication, publicationAsFileList) => {
    const { props, state } = this

    const workspaceId = props.currentWorkspace.id
    const publicationName = this.buildPublicationName(props.user.publicName, props.user.lang)

    if (publicationAsFileList.length !== 1) return

    const fileToUpload = publicationAsFileList[0]
    const fetchPostPublicationFile = await props.dispatch(postPublicationFile(workspaceId, fileToUpload, publicationName))

    const isUploadInError = isFileUploadInErrorState(fetchPostPublicationFile)
    if (isUploadInError) {
      props.dispatch(newFlashMessage(fetchPostPublicationFile.errorMessage, 'warning'))
      return
    }

    if (publication !== '') {
      try {
        await props.appContentSaveNewComment(
          fetchPostPublicationFile.responseJson,
          state.publicationWysiwyg,
          publication,
          [],
          this.setState.bind(this),
          fetchPostPublicationFile.responseJson.slug,
          props.user.username,
          'Publication'
        )
      } catch (e) {
        props.dispatch(newFlashMessage(e.message || props.t('Error while saving the comment')))
      }
    }

    if (state.publicationWysiwyg) globalThis.tinymce.get(wysiwygId).setContent('')
  }

  handleClickValidateAnyway = async (publication, publicationAsFileList = []) => {
    const { state, props } = this

    if (state.showEditPopup) {
      this.handleClickValidateAnywayEdit()
      return
    }

    if (publication !== '' && publicationAsFileList.length === 0) {
      this.saveThreadPublication(publication)
    }

    if (publicationAsFileList.length > 0) {
      this.processSaveFilePublication(publication, publicationAsFileList)
    }

    setLocalStorageItem(
      CONTENT_TYPE.THREAD,
      newPublicationId,
      parseInt(props.match.params.idws),
      LOCAL_STORAGE_FIELD.COMMENT,
      ''
    )
  }

  handleClickCopyLink = content => {
    const { props } = this
    handleClickCopyLink(content)
    props.dispatch(newFlashMessage(props.t('The link has been copied to clipboard'), 'info'))
  }

  handleClickReorder = () => {
    this.props.dispatch(updatePublicationList())
    this.setState({ showReorderButton: false })
  }

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.props.currentWorkspace.id)
  }

  getPreviewLinkParameters = (publication) => {
    const previewLinkType = publication.type === CONTENT_TYPE.FILE
      ? LINK_TYPE.DOWNLOAD
      : LINK_TYPE.NONE

    const previewLink = publication.type === CONTENT_TYPE.FILE
      ? getFileDownloadUrl(FETCH_CONFIG.apiUrl, publication.workspaceId, publication.id, publication.fileName)
      : PAGE.WORKSPACE.CONTENT(publication.workspaceId, publication.type, publication.id)
    return { previewLinkType, previewLink }
  }

  isEditionAllowed = (publication, userRoleIdInWorkspace) => {
    return publication.type === CONTENT_TYPE.THREAD &&
      (
        userRoleIdInWorkspace === ROLE.workspaceManager.id ||
        this.props.user.userId === publication.author.user_id
      )
  }

  render () {
    const { props, state } = this
    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, props.currentWorkspace.memberList, ROLE_LIST)
    const currentPublicationId = Number(props.match.params.idcts || 0)
    const isPublicationListEmpty = props.publicationPage.list.length === 0

    return (
      <ScrollToBottomWrapper
        customClass='publications'
        isLastItemAddedFromCurrentToken={state.isLastItemAddedFromCurrentToken}
        shouldScrollToBottom={state.newCurrentPublication}
      >
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />
        {userRoleIdInWorkspace >= ROLE.contributor.id && (
          <div className='publishAreaContainer'>
            <CommentArea
              apiUrl={FETCH_CONFIG.apiUrl}
              bottomAutocomplete
              buttonLabel={props.t('Publish')}
              contentId={newPublicationId}
              contentType={CONTENT_TYPE.THREAD}
              customColor={COLORS.PUBLICATION}
              customClass='publishArea'
              icon='fa-fw far fa-paper-plane'
              id={wysiwygId}
              invalidMentionList={state.invalidMentionList}
              lang={props.user.lang}
              multipleFiles={false}
              onClickCancelSave={this.handleCancelSave}
              onClickSaveAnyway={this.handleClickValidateAnyway}
              onClickValidateNewCommentBtn={this.handleClickPublish}
              onClickWysiwygBtn={this.handleToggleWysiwyg}
              placeHolder={props.t('Share a news...')}
              searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
              showInvalidMentionPopup={!state.loading && state.showInvalidMentionPopupInComment}
              workspaceId={parseInt(props.match.params.idws)}
              wysiwygIdSelector={`#${wysiwygId}`}
              wysiwyg={state.publicationWysiwyg}
            />
          </div>
        )}

        {!state.loading && state.showReorderButton && (
          <IconButton
            customClass='publications__reorder'
            text={props.t('Reorder')}
            icon='fas fa-redo-alt'
            intent='link'
            onClick={this.handleClickReorder}
          />
        )}

        {state.loading && <Loading />}

        {!state.loading && isPublicationListEmpty && (
          <div className='publications__empty'>
            {props.t('This space does not have any news yet, create the first news post using the area at the bottom of the page.')}
          </div>
        )}

        {!state.loading && props.publicationPage.list.map(publication =>
          <FeedItemWithPreview
            contentAvailable
            allowEdition={this.isEditionAllowed(publication, userRoleIdInWorkspace)}
            commentList={publication.commentList}
            content={publication}
            customColor={COLORS.PUBLICATION}
            key={`publication_${publication.id}`}
            ref={publication.id === currentPublicationId ? this.currentPublicationRef : undefined}
            memberList={props.currentWorkspace.memberList}
            onClickCopyLink={() => this.handleClickCopyLink(publication)}
            isPublication
            inRecentActivities={false}
            onClickEdit={() => this.handleClickEdit(publication)}
            showTimeline
            workspaceId={Number(publication.workspaceId)}
            user={props.user}
            {...this.getPreviewLinkParameters(publication)}
          />
        )}

        {!state.loading && state.showEditPopup && (
          <EditCommentPopup
            apiUrl={FETCH_CONFIG.apiUrl}
            comment={state.commentToEdit.raw_content}
            commentId={state.commentToEdit.content_id}
            customColor={COLORS.PUBLICATION}
            loggedUserLanguage={props.user.lang}
            onClickValidate={this.handleClickValidateEdit}
            onClickClose={() => this.setState({ showEditPopup: false })}
            workspaceId={props.currentWorkspace.id}
          />
        )}

        {!state.loading && props.publicationPage.hasNextPage && (
          <IconButton
            text={props.t('See more')}
            icon='fas fa-chevron-down'
            dataCy='showMorePublicationItemsBtn'
            customClass='publications__showMoreButton'
            onClick={() => this.getPublicationPage(props.publicationPage.nextPageToken)}
          />
        )}
      </ScrollToBottomWrapper>
    )
  }
}

const mapStateToProps = ({
  breadcrumbs,
  currentWorkspace,
  publicationPage,
  user
}) => ({ breadcrumbs, currentWorkspace, publicationPage, user })
export default connect(mapStateToProps)(withRouter(translate()(appContentFactory(TracimComponent(Publications)))))
