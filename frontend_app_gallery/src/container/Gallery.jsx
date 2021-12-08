import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  buildFilePreviewUrl,
  IconButton,
  removeExtensionOfFilename,
  getFolderContentList,
  getWorkspaceDetail,
  getFileContent,
  getFolderDetail,
  putFileIsDeleted,
  getWorkspaceContentList,
  sendGlobalFlashMessage,
  CUSTOM_EVENT,
  PageTitle,
  PageWrapper,
  PageContent,
  CardPopup,
  handleFetchResult,
  appContentFactory,
  TracimComponent,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  BREADCRUMBS_TYPE,
  PAGE,
  ROLE
} from 'tracim_frontend_lib'
import Carousel from '../component/Carousel.jsx'
import { DIRECTION, buildRawFileUrl } from '../helper.js'
import { debug } from '../debug.js'
import ReactImageLightbox, { LightboxRotation } from '../Lightbox.js'
import 'react-image-lightbox/style.css'
import Fullscreen from 'react-full-screen'
import classnames from 'classnames'

const qs = require('query-string')

export class Gallery extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug

    this.state = {
      appName: 'gallery',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      breadcrumbsList: [],
      appMounted: false,
      folderId: props.data
        ? (qs.parse(props.data.config.history.location.search).folder_ids || undefined)
        : debug.config.folderId,
      folderDetail: {
        fileName: '',
        folderParentIdList: []
      },
      imagePreviewList: [],
      displayedPictureIndex: 0,
      autoPlay: null,
      fullscreen: false,
      displayPopupDelete: false,
      imagePreviewListLoaded: false,
      breadcrumbsLoaded: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage },
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreatedOrUndeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreatedOrUndeleted },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified }
    ])

    this.lightboxRotation = new LightboxRotation()
  }

  // TLM Handlers

  // NOTE - RJ - 2020-06-10
  // a comment about the handling of live messages here:
  // https://github.com/tracim/tracim/issues/3107#issuecomment-643994410

  liveMessageNotRelevant (data, state) {
    if (Number(data.fields.content.workspace_id) !== Number(state.config.appConfig.workspaceId)) {
      return true
    }

    if (state.folderId || data.fields.content.parent_id) {
      const currentFolderId = Number(state.folderId) || 0
      const liveMessageFolderId = Number(data.fields.content.parent_id) || 0
      return currentFolderId !== liveMessageFolderId
    }

    return false
  }

  handleShowApp = data => {
    const { state } = this
    console.log('%c<Gallery> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)
    const newFolderId = qs.parse(data.config.history.location.search).folder_ids
    if (data.config.appConfig.workspaceId !== state.config.appConfig.workspaceId || newFolderId !== state.folderId) {
      this.setState({
        config: data.config,
        folderId: newFolderId
      })
    }
  }

  handleWorkspaceModified = data => {
    const { state } = this
    if (Number(data.fields.workspace.workspace_id) !== Number(state.config.appConfig.workspaceId)) return
    this.setState({ workspaceLabel: data.fields.workspace.label })
    this.updateBreadcrumbsAndTitle(data.fields.workspace.label, state.folderDetail)
  }

  handleContentCreatedOrUndeleted = data => {
    if (this.liveMessageNotRelevant(data, this.state)) return

    const preview = this.buildPreview(data.content)
    if (preview) {
      this.setNewPicturesPreviews([preview, ...this.state.imagePreviewList].sort(this.sortPreviews))
    }
  }

  handleContentModified = data => {
    const { state } = this
    if (this.liveMessageNotRelevant(data, state)) {
      // INFO - GM - 2020-07-20 - The if below covers the move functionality.
      if (state.imagePreviewList.find(p => data.fields.content.content_id === p.contentId)) {
        this.removeContent(data.fields.content.content_id)
      }
      return
    }

    // RJ - 2020-06-15 - NOTE
    // We need to reorder the list because the label of the file could have changed.
    // We could test whether this is the case, but handling only one case is
    // probably better.

    const imagePreviewList = state.imagePreviewList.filter(
      image => image.contentId !== data.fields.content.content_id
    )

    const preview = this.buildPreview(data.fields.content)
    if (preview) {
      // RJ - 2020-06-15 - NOTE
      // Unlikely, but a picture could be replaced by a file of another type
      // hence the check.
      imagePreviewList.push(preview)
    }

    this.setNewPicturesPreviews(imagePreviewList.sort(this.sortPreviews))
  }

  handleContentDeleted = data => {
    const { state } = this
    if (this.liveMessageNotRelevant(data, state)) return

    this.removeContent(data.fields.content.content_id)
  }

  removeContent = (contentId) => {
    const { state } = this

    let displayedPictureIndex = state.displayedPictureIndex
    let imagePreviewList = state.imagePreviewList

    let deletedIndex = -1

    imagePreviewList = state.imagePreviewList.filter((image, i) => {
      const isDeletedImage = Number(image.contentId) === Number(contentId)
      if (isDeletedImage) deletedIndex = i
      return !isDeletedImage
    })

    if (deletedIndex !== -1) {
      // We set the new current index
      if (deletedIndex < state.displayedPictureIndex) {
        // RJ - 2020-06-15 - NOTE
        // if the currently displayed picture is after the deleted image
        // we have to fix its index. The current picture's new index is
        // decremented.
        displayedPictureIndex--
      } else if (deletedIndex === state.displayedPictureIndex) {
        // RJ - 2020-06-15 - NOTE
        // if the currently displayed picture is the one being deleted
        // we show the next picture, which index is the now the one of the
        // deleted picture.

        if (state.displayedPictureIndex >= imagePreviewList.length) {
          // RJ - 2020-06-15 - NOTE
          // if this picture does not exist, though, we take the previous one.
          // if no there are no pictures left, we take 0, which is the default
          // value of displayedPictureIndex.
          displayedPictureIndex = Math.max(0, state.displayedPictureIndex - 1)
        }
      }
    }

    this.setState({ imagePreviewList, displayedPictureIndex })
  }

  sortPreviews (img1, img2) {
    return img1.label.localeCompare(img2.label)
  }

  setNewPicturesPreviews (imagePreviewList) {
    const displayedPictureId = this.displayedPictureId()

    const displayedPictureIndex = Math.max(
      0,
      displayedPictureId
        ? imagePreviewList.findIndex(image => image.contentId === displayedPictureId)
        : 0
    )

    this.setState({ imagePreviewList, displayedPictureIndex })
  }

  updateBreadcrumbsAndTitle = (workspaceLabel, folderDetail) => {
    const { props } = this
    this.buildBreadcrumbs(workspaceLabel, folderDetail, false)
    if (workspaceLabel) this.setHeadTitle(`${props.t('Gallery')} · ${workspaceLabel}`)
  }

  handleAllAppChangeLanguage = data => {
    const { state } = this
    console.log('%c<Gallery> Custom event', 'color: #28a745', data)
    this.setState(prev => ({
      loggedUser: {
        ...prev.loggedUser,
        lang: data
      }
    }))
    i18n.changeLanguage(data)
    this.updateBreadcrumbsAndTitle(state.workspaceLabel, state.folderDetail)
  }

  async componentDidMount () {
    const { state } = this

    console.log('%c<Gallery> did mount', `color: ${state.config.hexcolor}`)

    this.loadGalleryList(state.config.appConfig.workspaceId, state.folderId)
    const contentDetail = await this.loadContentDetails()
    this.buildBreadcrumbs(contentDetail.workspaceLabel, contentDetail.folderDetail, false)
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    // console.log('%c<Gallery> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.workspaceId !== state.config.appConfig.workspaceId || prevState.folderId !== state.folderId) {
      this.setState({ imagePreviewListLoaded: false, imagePreviewList: [] })
      this.loadGalleryList(state.config.appConfig.workspaceId, state.folderId)
      const contentDetail = await this.loadContentDetails()
      this.buildBreadcrumbs(contentDetail.workspaceLabel, contentDetail.folderDetail, false)
    } else if (
      (prevState.imagePreviewList[prevState.displayedPictureIndex] || {}).fileName !== (this.displayedPicture() || {}).fileName ||
      prevState.imagePreviewListLoaded === !state.imagePreviewListLoaded ||
      prevState.breadcrumbsLoaded === !state.breadcrumbsLoaded
    ) {
      this.buildBreadcrumbs(state.workspaceLabel, state.folderDetail, true)
    }
  }

  componentWillUnmount () {
    console.log('%c<Gallery> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  async loadContentDetails () {
    const { state } = this

    const contentDetail = {}

    contentDetail.workspaceLabel = await this.loadWorkspaceLabel()
    if (state.folderId) {
      contentDetail.folderDetail = await this.loadFolderDetailAndParentsDetails(state.config.appConfig.workspaceId, state.folderId)
      this.setState({ folderDetail: contentDetail.folderDetail })
    }
    this.setState({ workspaceLabel: contentDetail.workspaceLabel })
    return contentDetail
  }

  buildBreadcrumbs = (workspaceLabel, folderDetail, includeFile) => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: PAGE.WORKSPACE.DASHBOARD(state.config.appConfig.workspaceId),
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN,
      label: workspaceLabel,
      isALink: true
    }]
    if (state.folderId) {
      breadcrumbsList.push({
        link: `/ui/workspaces/${state.config.appConfig.workspaceId}/contents?folder_open=${state.folderId},${folderDetail.folderParentIdList.join(',')}`,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN,
        label: folderDetail.fileName,
        isALink: true
      })
    }
    breadcrumbsList.push({
      link: PAGE.WORKSPACE.GALLERY(state.config.appConfig.workspaceId),
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN,
      label: props.t('Gallery'),
      isALink: true
    })
    if (includeFile && state.imagePreviewList && state.imagePreviewList.length > 0) {
      const fileName = this.displayedPicture().fileName
      breadcrumbsList.push({
        link: PAGE.WORKSPACE.CONTENT(state.config.appConfig.workspaceId, 'file', this.displayedPictureId()),
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN,
        label: fileName,
        isALink: true
      })
    }

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({ breadcrumbsList, breadcrumbsLoaded: !includeFile })
  }

  loadFolderDetailAndParentsDetails = async (workspaceId, folderId) => {
    const { state, props } = this

    const folderDetail = {
      fileName: '',
      folderParentIdList: []
    }

    let fetchContentDetail = await handleFetchResult(
      await getFolderDetail(state.config.apiUrl, workspaceId, folderId)
    )

    switch (fetchContentDetail.apiResponse.status) {
      case 200: {
        folderDetail.fileName = fetchContentDetail.body.filename
        folderDetail.folderParentIdList = fetchContentDetail.body.parent_id ? [fetchContentDetail.body.parent_id] : []

        let hasReachRootWorkspace = fetchContentDetail.body.parent_id !== null
        while (hasReachRootWorkspace) {
          const prevParentId = fetchContentDetail.body.parent_id

          fetchContentDetail = await handleFetchResult(
            await getFolderDetail(state.config.apiUrl, workspaceId, prevParentId)
          )
          if (fetchContentDetail.apiResponse.status === 200) {
            if (fetchContentDetail.body.parent_id === null || prevParentId === fetchContentDetail.body.parent_id) {
              hasReachRootWorkspace = false
            } else {
              folderDetail.folderParentIdList.push(fetchContentDetail.body.parent_id)
            }
          } else {
            sendGlobalFlashMessage(props.t('Error while loading folder detail'))
            hasReachRootWorkspace = false
          }
        }
        break
      }
      default:
        sendGlobalFlashMessage(props.t('Error while loading folder detail'))
    }
    return folderDetail
  }

  loadGalleryList = async (workspaceId, folderId) => {
    const { state, props } = this

    let fetchContentList
    if (folderId) {
      fetchContentList = await handleFetchResult(
        await getFolderContentList(state.config.apiUrl, workspaceId, folderId)
      )
    } else {
      fetchContentList = await handleFetchResult(
        await getWorkspaceContentList(state.config.apiUrl, workspaceId)
      )
    }

    switch (fetchContentList.apiResponse.status) {
      case 200: {
        const imagePreviewList = await this.loadPreviewList(
          fetchContentList.body.items
            .filter(c => c.content_type === 'file')
            .map(c => c.content_id)
        )

        this.setState({
          imagePreviewList,
          imagePreviewListLoaded: true
        })

        break
      }
      default: sendGlobalFlashMessage(props.t('Error while loading content list'))
    }
  }

  buildPreview = (file) => {
    if (!file.has_jpeg_preview) return false

    const { state } = this

    const filenameNoExtension = removeExtensionOfFilename(file.filename)

    const previewUrl = buildFilePreviewUrl(
      state.config.apiUrl,
      state.config.appConfig.workspaceId,
      file.content_id,
      file.current_revision_id,
      filenameNoExtension,
      1,
      1400,
      1400
    )

    const previewUrlForThumbnail = buildFilePreviewUrl(
      state.config.apiUrl,
      state.config.appConfig.workspaceId,
      file.content_id,
      file.current_revision_id,
      filenameNoExtension,
      1,
      125,
      125
    )

    const lightBoxUrlList = (
      new Array(file.page_nb)
        .fill('')
        .map((n, j) => buildFilePreviewUrl(
          state.config.apiUrl,
          state.config.appConfig.workspaceId,
          file.content_id,
          file.current_revision_id,
          filenameNoExtension,
          j + 1,
          1920,
          1920
        ))
    )

    const rawFileUrl = buildRawFileUrl(
      state.config.apiUrl,
      state.config.appConfig.workspaceId,
      file.content_id,
      file.filename
    )

    return {
      contentId: file.content_id,
      label: file.label,
      src: previewUrl,
      fileName: file.filename,
      lightBoxUrlList,
      previewUrlForThumbnail,
      rotationAngle: 0,
      rawFileUrl
    }
  }

  loadPreviewList = async (imageContentIds) => {
    return (await Promise.all(imageContentIds.map(async (contentId) => {
      const fetchFileContent = await handleFetchResult(
        await getFileContent(
          this.state.config.apiUrl,
          this.state.config.appConfig.workspaceId,
          contentId
        )
      )

      if (fetchFileContent.apiResponse.status === 200) {
        return this.buildPreview(fetchFileContent.body)
      }

      sendGlobalFlashMessage(this.props.t('Error while loading file preview'))
      return false
    }))).filter(i => i !== false)
  }

  loadWorkspaceLabel = async () => {
    const { state, props } = this

    let workspaceLabel = ''

    const fetchResultWorkspaceDetail = await handleFetchResult(
      await getWorkspaceDetail(state.config.apiUrl, state.config.appConfig.workspaceId)
    )

    switch (fetchResultWorkspaceDetail.apiResponse.status) {
      case 200:
        workspaceLabel = fetchResultWorkspaceDetail.body.label
        this.setHeadTitle(`${props.t('Gallery')} · ${fetchResultWorkspaceDetail.body.label}`)
        break
      default:
        sendGlobalFlashMessage(props.t('Error while loading space detail'))
    }
    return workspaceLabel
  }

  setHeadTitle = (title) => {
    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.SET_HEAD_TITLE,
      data: { title: title }
    })
  }

  handleClickHideImageRaw = () => {
    this.reactImageLightBoxModalRoot.style.cursor = 'default'
    this.setState({ displayLightbox: false, fullscreen: false })
  }

  handleClickShowImageRaw = () => {
    this.setState({ displayLightbox: true })
  }

  handleClickPreviousNextPage = previousNext => {
    const { state } = this

    let nextPageNumber = previousNext === DIRECTION.LEFT ? state.displayedPictureIndex - 1 : state.displayedPictureIndex + 1

    if (previousNext === DIRECTION.RIGHT && state.displayedPictureIndex === state.imagePreviewList.length - 1) nextPageNumber = 0
    if (previousNext === DIRECTION.LEFT && state.displayedPictureIndex === 0) nextPageNumber = state.imagePreviewList.length - 1

    this.setState({
      displayedPictureIndex: nextPageNumber
    })
  }

  getPreviousImageUrl = () => {
    const { state } = this

    if (state.imagePreviewList.length <= 1) return

    if (state.displayedPictureIndex === 0) return state.imagePreviewList[state.imagePreviewList.length - 1].lightBoxUrlList[0]
    return state.imagePreviewList[state.displayedPictureIndex - 1].lightBoxUrlList[0]
  }

  getNextImageUrl = () => {
    const { state } = this

    if (state.imagePreviewList.length <= 1) return

    if (state.displayedPictureIndex === state.imagePreviewList.length - 1) return state.imagePreviewList[0].lightBoxUrlList[0]
    return state.imagePreviewList[state.displayedPictureIndex + 1].lightBoxUrlList[0]
  }

  handleCarouselPositionChange = (pictureIndex) => {
    if (pictureIndex < 0) return
    this.setState({ displayedPictureIndex: pictureIndex })
  }

  handleOpenDeleteFilePopup = () => {
    if (this.state.imagePreviewList.length) {
      this.setState({
        displayPopupDelete: true
      })
    } else {
      sendGlobalFlashMessage(this.props.t("There isn't any picture to delete."))
    }
  }

  handleCloseDeleteFilePopup = () => {
    this.setState({
      displayPopupDelete: false,
      displayPopupDeleteErrorNoPhotoToDelete: false
    })
  }

  deleteFile = async (filePosition) => {
    const { state } = this
    const putResult = await putFileIsDeleted(
      state.config.apiUrl,
      state.config.appConfig.workspaceId,
      state.imagePreviewList[filePosition].contentId
    )

    switch (putResult.status) {
      case 204:
        this.setState({
          displayPopupDelete: false
        })
        break
      case 403:
        sendGlobalFlashMessage(this.props.t('Insufficient permissions'))
        break
      default:
        sendGlobalFlashMessage(this.props.t('Error while deleting document'))
        break
    }
  }

  onClickSlickPlay (play) {
    const { state } = this

    if (state.displayLightbox) this.displayReactImageLightBoxArrows(!play)

    if (play) {
      this.setState({
        autoPlay: setInterval(() => this.handleClickPreviousNextPage(DIRECTION.RIGHT), 3000)
      })
    } else {
      clearInterval(this.state.autoPlay)
      this.setState({
        autoPlay: null
      })
    }
  }

  displayReactImageLightBoxArrows (display) {
    document.getElementsByClassName('ril__navButtons').forEach(arrow => {
      if (arrow.style) arrow.style.visibility = display ? 'visible' : 'hidden'
    })
  }

  rotateImg (pictureId, direction) {
    const { state } = this

    if (pictureId < 0 || pictureId >= state.imagePreviewList.length || !direction) return

    if (!state.imagePreviewList[pictureId]) return

    const imagePreviewList = state.imagePreviewList
    let rotationAngle = 0
    switch (imagePreviewList[pictureId].rotationAngle) {
      case (0):
        rotationAngle = direction === DIRECTION.RIGHT ? 90 : 270
        break
      case (90):
        rotationAngle = direction === DIRECTION.RIGHT ? 180 : 0
        break
      case (180):
        rotationAngle = direction === DIRECTION.RIGHT ? 270 : 90
        break
      case (270):
        rotationAngle = direction === DIRECTION.RIGHT ? 0 : 180
        break
      default:
    }
    imagePreviewList[pictureId].rotationAngle = rotationAngle
    this.setState({ imagePreviewList })
  }

  getRawFileUrlSelectedFile () {
    const { state } = this

    if (state.imagePreviewList.length === 0 || !this.displayedPicture()) return

    return this.displayedPicture().rawFileUrl
  }

  handleMouseMove = () => {
    clearInterval(this.mouseMoveTimeout)
    if (this.state.displayLightbox) {
      // INFO - GM - 2019-12-11 - It use dom manipulation instead of react state because ReactImageLightBox doesn't offer custom style props for the toolbar
      document.getElementsByClassName('ril__toolbar')[0].style.transform = 'translateY(0px)'
      document.getElementsByClassName('ril__toolbar')[0].style['transition-duration'] = '0.5s'
      document.getElementsByClassName('ril__navButtons').forEach(e => {
        e.style['transition-duration'] = '0.5s'
        e.style.transform = 'translateX(0px)'
      })
      this.reactImageLightBoxModalRoot.style.cursor = 'default'
    }
    this.mouseMoveTimeout = setInterval(() => {
      if (this.state.displayLightbox) {
        document.getElementsByClassName('ril__toolbar')[0].style.transform = 'translateY(-50px)'
        document.getElementsByClassName('ril__toolbar')[0].style['transition-duration'] = '0.5s'
        document.getElementsByClassName('ril__navButtonNext')[0].style.transform = 'translateX(100%)'
        document.getElementsByClassName('ril__navButtonPrev')[0].style.transform = 'translateX(-100%)'
        document.getElementsByClassName('ril__navButtons').forEach(e => {
          e.style['transition-duration'] = '0.5s'
        })
        this.reactImageLightBoxModalRoot.style.cursor = 'none'
      }
    }, 2000)
  }

  handleAfterOpenReactImageLightBox = () => {
    const { state } = this

    if (state.autoPlay) this.displayReactImageLightBoxArrows(false)
  }

  // INFO - 2020-06-09 - RJ this function returns undefined if there is no current picture
  displayedPicture = () => {
    return this.state.imagePreviewList[this.state.displayedPictureIndex]
  }

  displayedPictureId = () => {
    return (this.displayedPicture() || { contentId: -1 }).contentId
  }

  render () {
    const { state, props } = this

    if (this.displayedPicture()) this.lightboxRotation.changeAngle(this.displayedPicture().rotationAngle)

    return (
      <div className='gallery-scrollView'>
        <PageWrapper customClass='gallery'>
          <PageTitle
            title={state.folderId ? state.folderDetail.fileName : state.workspaceLabel}
            icon='far fa-image'
            breadcrumbsList={state.breadcrumbsList}
            parentClass='gallery__header'
          />

          <PageContent>
            <div className='gallery__action__button'>
              <IconButton
                customClass='gallery__action__button__play'
                onClick={() => this.onClickSlickPlay(!state.autoPlay)}
                dataCy='gallery__action__button__auto__play'
                text={state.autoPlay ? props.t('Pause') : props.t('Play')}
                icon={`fas ${state.autoPlay ? 'fa-pause' : 'fa-play'}`}
              />

              <IconButton
                customClass='gallery__action__button__rotation__left'
                onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.LEFT)}
                text={props.t('Rotate 90° left')}
                icon='fas fa-undo'
              />

              <IconButton
                customClass='gallery__action__button__rotation__right'
                onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.RIGHT)}
                text={props.t('Rotate 90° right')}
                icon='fas fa-redo'
              />

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <IconButton
                  customClass='gallery__action__button__delete'
                  dataCy='gallery__action__button__delete'
                  onClick={this.handleOpenDeleteFilePopup}
                  text={props.t('Delete')}
                  icon='far fa-trash-alt'
                />
              )}
            </div>

            {(state.imagePreviewListLoaded
              ? (
                <Carousel
                  displayedPictureIndex={state.displayedPictureIndex}
                  slides={state.imagePreviewList}
                  onCarouselPositionChange={this.handleCarouselPositionChange}
                  onClickShowImageRaw={this.handleClickShowImageRaw}
                  disableAnimation={state.displayLightbox}
                  isWorkspaceRoot={state.folderId === 0}
                  autoPlay={state.autoPlay}
                />
              ) : (
                <div className='gallery__loader'>
                  <i className='fas fa-spinner fa-spin gallery__loader__icon' />
                </div>
              )
            )}

            <Fullscreen
              enabled={state.fullscreen}
              onChange={fullscreen => this.setState({ fullscreen })}
            >
              <div ref={modalRoot => (this.reactImageLightBoxModalRoot = modalRoot)} />

              {state.displayLightbox && this.displayedPicture() && (
                <div className='gallery__mouse__listener' onMouseMove={this.handleMouseMove}>
                  <ReactImageLightbox
                    prevSrc={this.getPreviousImageUrl()}
                    mainSrc={this.displayedPicture().lightBoxUrlList[0]}
                    nextSrc={this.getNextImageUrl()}
                    onCloseRequest={this.handleClickHideImageRaw}
                    onMovePrevRequest={() => { this.handleClickPreviousNextPage(DIRECTION.LEFT) }}
                    onMoveNextRequest={() => { this.handleClickPreviousNextPage(DIRECTION.RIGHT) }}
                    imagePadding={0}
                    onAfterOpen={this.handleAfterOpenReactImageLightBox}
                    reactModalProps={{ parentSelector: () => this.reactImageLightBoxModalRoot }}
                    toolbarButtons={[(
                      <button
                        className='btn'
                        onClick={() => this.onClickSlickPlay(!state.autoPlay)}
                        title={state.autoPlay ? props.t('Pause') : props.t('Play')}
                        data-cy='gallery__action__button__lightbox__auto__play'
                        key='btn_autoplay'
                      >
                        <i className={classnames('fa-fw fas', state.autoPlay ? 'fa-pause' : 'fa-play')} />
                      </button>
                    ), (
                      <button
                        className='btn'
                        onClick={() => this.setState((prevState) => ({ fullscreen: !prevState.fullscreen }))}
                        title={state.fullscreen ? props.t('Disable fullscreen') : props.t('Enable fullscreen')}
                        data-cy='gallery__action__button__lightbox__fullscreen'
                        key='btn_fullscreen'
                      >
                        <i className={classnames('fa-fw fas', state.fullscreen ? 'fa-compress' : 'fa-expand-arrows-alt')} />
                      </button>
                    ), (
                      <button
                        className='btn'
                        onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.LEFT)}
                        title={props.t('Rotate 90° left')}
                        data-cy='gallery__action__button__lightbox__rotation__left'
                        key='btn_rotate_left'
                      >
                        <i className='fa-fw fas fa-undo' />
                      </button>
                    ), (
                      <button
                        className='btn gallery__action__button__lightbox__rotation__right'
                        onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.RIGHT)}
                        title={props.t('Rotate 90° right')}
                        key='btn_rotate_right'
                      >
                        <i className='fa-fw fas fa-redo' />
                      </button>
                    ), (
                      <a
                        className='btn gallery__action__button__lightbox__openRawContent'
                        title={props.t('Open raw file')}
                        href={this.getRawFileUrlSelectedFile()}
                        target='_blank'
                        rel='noopener noreferrer'
                        key='btn_open_raw'
                      >
                        <i className='fa-fw fas fa-download' />
                      </a>
                    )]}
                  />
                </div>
              )}
            </Fullscreen>

            {state.displayPopupDelete && (
              <CardPopup
                customClass='gallery__delete__file__popup'
                customHeaderClass='primaryColorBg'
                onClose={this.handleCloseDeleteFilePopup}
                label={props.t('Are you sure?')}
                faIcon='far fa-fw fa-trash-alt'
              >
                <div className='gallery__delete__file__popup__body'>
                  <div className='gallery__delete__file__popup__body__btn'>
                    <IconButton
                      onClick={this.handleCloseDeleteFilePopup}
                      text={props.t('Cancel')}
                      icon='fas fa-times'
                    />

                    <IconButton
                      customClass='gallery__delete__file__popup__body__btn__delete'
                      intent='primary'
                      mode='light'
                      onClick={() => this.deleteFile(this.state.displayedPictureIndex)}
                      dataCy='gallery__delete__file__popup__body__btn__delete'
                      text={props.t('Delete')}
                      icon='far fa-trash-alt'
                    />
                  </div>
                </div>
              </CardPopup>
            )}
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(Gallery)))
