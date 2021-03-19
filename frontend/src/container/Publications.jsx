import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import {
  addClassToMentionsOfUser,
  appContentFactory,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CommentTextArea,
  ConfirmPopup,
  CUSTOM_EVENT,
  displayDistanceDate,
  getContentComment,
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
  TRANSLATION_STATE
} from 'tracim_frontend_lib'
import {
  CONTENT_NAMESPACE,
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
  addCommentListToPublication,
  appendCommentToPublication,
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
import FeedItemWithPreview from './FeedItemWithPreview.jsx'

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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommented }
    ])

    this.state = {
      invalidMentionList: [],
      newComment: '',
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
      globalThis.tinymce.remove('#wysiwygTimelineCommentPublication')
    }
    if (props.currentWorkspace.memberList.length === 0) this.loadMemberList()
  }

  componentWillUnmount () {
    globalThis.tinymce.remove('#wysiwygTimelineCommentPublication')
  }

  handleAllAppChangeLanguage = (data) => {
    if (this.state.publicationWysiwyg) {
      globalThis.tinymce.remove('#wysiwygTimelineCommentPublication')
      globalThis.wysiwyg('#wysiwygTimelineCommentPublication', data, this.handleChangeNewPublication)
    }
    this.buildBreadcrumbs()
    this.setHeadTitle()
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
    if (data.fields.client_token === getOrCreateSessionClientToken()) return
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
      this.getCommentList({ content_id: parentPublication.id })
      return
    }

    const newComment = {
      ...data.fields.content,
      timelineType: data.fields.content.content_type,
      created_raw: data.fields.content.created,
      created: displayDistanceDate(data.fields.content.created, props.user.lang),
      raw_content: addClassToMentionsOfUser(data.fields.content.raw_content, props.user.username),
      translatedRawContent: null,
      translationState: TRANSLATION_STATE.DISABLED
    }
    props.dispatch(appendCommentToPublication(newComment))
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
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  handleInitPublicationWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      '#wysiwygTimelineCommentPublication',
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
    const workspaceId = props.match.params.idws
    const fetchGetPublicationList = await props.dispatch(getPublicationList(workspaceId))
    switch (fetchGetPublicationList.status) {
      case 200: {
        fetchGetPublicationList.json.forEach(publication => this.getCommentList(publication))
        props.dispatch(setPublicationList(fetchGetPublicationList.json))
        break
      }
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('publication list')}`, 'warning')); break
    }
  }

  getCommentList = async (publication) => {
    const { props } = this
    const workspaceId = props.match.params.idws
    const fetchGetContentComment = await handleFetchResult(await getContentComment(FETCH_CONFIG.apiUrl, workspaceId, publication.content_id))
    switch (fetchGetContentComment.apiResponse.status) {
      case 200: {
        const commentList = fetchGetContentComment.body.map(c => ({
          ...c,
          timelineType: c.content_type,
          created_raw: c.created,
          created: displayDistanceDate(c.created, props.user.lang),
          raw_content: addClassToMentionsOfUser(c.raw_content, props.user.username),
          translatedRawContent: null,
          translationState: TRANSLATION_STATE.DISABLED
        }))
        // INFO - G.B. - 2021-03-19 - We remove the first element because it's already shown in the preview
        props.dispatch(addCommentListToPublication(publication.content_id, commentList.slice(1)))
        break
      }
      default: props.dispatch(newFlashMessage(`${props.t('Error')}`, 'warning')); break
    }
  }

  handleChangeNewPublication = e => this.setState({ newComment: e.target.value })

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

  handleClickValidateAnyway = async () => {
    const { props, state } = this
    const workspaceId = props.match.params.idws
    const randomNumber = uuidv4()

    const fetchPostThreadPublication = await props.dispatch(postThreadPublication(
      workspaceId,
      `thread_${randomNumber}`
    ))

    switch (fetchPostThreadPublication.status) {
      case 200: {
        try {
          props.appContentSaveNewComment(
            fetchPostThreadPublication.json,
            state.publicationWysiwyg,
            state.newComment,
            this.setState.bind(this),
            '',
            props.user.username,
            'Publication'
          )
        } catch (e) {
          this.sendGlobalFlashMessage(e.message || props.t('Error while saving the comment'))
        }
        props.dispatch(appendPublication(fetchPostThreadPublication.json))
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
    this.setState({ showReorderButton: false })
  }

  searchForMentionInQuery = async (query) => {
    return await this.props.searchForMentionInQuery(query, this.props.match.params.idws)
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
          itemList={props.publicationList}
          customClass='pageContentGeneric'
          shouldScrollToBottom
        >
          {props.publicationList.map(publication =>
            <FeedItemWithPreview
              commentList={publication.commentList}
              content={publication}
              customColor={publicationColor}
              key={`publication_${publication.id}`}
              memberList={props.currentWorkspace.memberList}
              onClickCopyLink={() => this.handleClickCopyLink(publication)}
              showTimeline
              user={{
                userId: props.user.userId,
                username: props.user.username,
                name: props.user.publicName,
                userRoleIdInWorkspace: userRoleIdInWorkspace
              }}
              workspaceId={Number(publication.workspaceId)}
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
                id='wysiwygTimelineCommentPublication'
                newComment={state.newComment}
                onChangeNewComment={this.handleChangeNewPublication}
                onInitWysiwyg={this.handleInitPublicationWysiwyg}
                searchForMentionInQuery={this.searchForMentionInQuery}
                wysiwyg={state.publicationWysiwyg}
                disableAutocompletePosition
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
                  disabled={state.newComment === ''}
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
export default connect(mapStateToProps)(withRouter(translate()(appContentFactory(TracimComponent(Publications)))))
