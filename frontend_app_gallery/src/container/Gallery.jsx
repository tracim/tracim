import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  buildFilePreviewUrl,
  removeExtensionOfFilename,
  CUSTOM_EVENT,
  PageTitle,
  PageWrapper,
  PageContent,
  CardPopup,
  handleFetchResult,
  buildHeadTitle,
  appContentFactory,
  TracimComponent,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  BREADCRUMBS_TYPE,
  ROLE
} from 'tracim_frontend_lib'
import { Link } from 'react-router-dom'
import {
  getFolderContentList,
  getWorkspaceDetail,
  getFileContent,
  getFolderDetail,
  putFileIsDeleted,
  getWorkspaceContentList
} from '../action.async'
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
      folderId: props.data ? (qs.parse(props.data.config.history.location.search).folder_ids || 0) : debug.config.folderId,
      folderDetail: {
        fileName: '',
        folderParentIdList: []
      },
      imagesPreviews: [],
      fileCurrentPage: 1,
      displayedPictureIndex: 0,
      autoPlay: null,
      fullscreen: false,
      displayPopupDelete: false,
      imagesPreviewsLoaded: false,
      breadcrumbsLoaded: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreatedOrModifiedOrUndeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCreatedOrModifiedOrUndeleted }
    ])

    this.lightboxRotation = new LightboxRotation()
  }

  // TLM Handlers
  handleContentCreatedOrModifiedOrUndeleted = data => {
    // A picture has been added or modified - let's reload the gallery list.
    // The picture could have been added anywhere in the list.
    // Any attempt to patch the image list may lead to inconsistency between a
    // page reload and an update using data in the TLM.
    this.loadGalleryList(this.state.config.appConfig.workspaceId, this.state.folderId)
  }

  handleContentDeleted = data => {
    const { state } = this

    let newDisplayedPictureIndex = state.displayedPictureIndex
    let newImagesPreviews = state.imagesPreviews

    const deletedIndex = state.imagesPreviews.findIndex(image => image.contentId === data.content.content_id)
    if (deletedIndex !== -1) {
      newImagesPreviews = state.imagesPreviews.slice(0, deletedIndex - 1).concat(
        state.imagesPreviews.slice(deletedIndex)
      )

      // We set the new current index
      if (deletedIndex < state.displayedPictureIndex) {
        // if the currently displayed picture is after the deleted image
        // we have to fix its index. The current picture's new index is
        // decremented.
        newDisplayedPictureIndex--
      } else if (deletedIndex === state.displayedPictureIndex) {
        // if the currently displayed picture is the one being deleted
        // we show the next picture, which index is the now the one of the
        // deleted picture.

        if (state.displayedPictureIndex >= newImagesPreviews.length) {
          // if this picture does not exist, though, we take the previous one.
          // if no there are no pictures left, we take 0, which is the default
          // value of displayedPictureIndex.
          newDisplayedPictureIndex = Math.max(0, state.displayedPictureIndex - 1)
        }
      }
    }

    this.setState({
      imagesPreviews: newImagesPreviews,
      displayedPictureIndex: newDisplayedPictureIndex
    })
  }

  handleShowApp = data => {
    console.log('%c<Gallery> Custom event', 'color: #28a745', data)
    const newFolderId = qs.parse(data.config.history.location.search).folder_ids
    if (data.config.appConfig.workspaceId !== this.state.config.appConfig.workspaceId || newFolderId !== this.state.folderId) {
      this.setState({
        config: data.config,
        folderId: newFolderId
      })
    }
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<Gallery> Custom event', 'color: #28a745', data)
    this.setState(prev => ({
      loggedUser: {
        ...prev.loggedUser,
        lang: data
      }
    }))
    i18n.changeLanguage(data)
    this.buildBreadcrumbs()
    if (this.state.workspaceLabel) this.setHeadTitle(`${this.props.t('Gallery')} · ${this.state.workspaceLabel}`)
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

    console.log('%c<Gallery> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.workspaceId !== state.config.appConfig.workspaceId || prevState.folderId !== state.folderId) {
      this.setState({ imagesPreviewsLoaded: false, imagesPreviews: [] })
      this.loadGalleryList(state.config.appConfig.workspaceId, state.folderId)
      const contentDetail = await this.loadContentDetails()
      this.buildBreadcrumbs(contentDetail.workspaceLabel, contentDetail.folderDetail, false)
    } else if (
      prevState.displayedPictureIndex !== state.displayedPictureIndex ||
      prevState.imagesPreviewsLoaded === !state.imagesPreviewsLoaded ||
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
      link: <Link to='/ui'><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/dashboard`}>{workspaceLabel}</Link>,
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN
    }]
    if (state.folderId) {
      breadcrumbsList.push({
        link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/contents?folder_open=${state.folderId},${folderDetail.folderParentIdList.join(',')}`}>{folderDetail.fileName}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }
    if (includeFile && state.imagesPreviews && state.imagesPreviews.length > 0) {
      breadcrumbsList.push({
        link: (
          <Link
            to={`/ui/workspaces/${state.config.appConfig.workspaceId}/contents/file/${this.displayedPictureId()}`}
          >
            {this.currentPicture().fileName}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
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
            this.sendGlobalFlashMessage(props.t('Error while loading folder detail'))
            hasReachRootWorkspace = false
          }
        }
        break
      }
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading folder detail'))
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
        const images = fetchContentList.body.filter(c => c.content_type === 'file').map(c => ({ src: '', contentId: c.content_id }))
        const imagesPreviews = await this.loadPreview(images)

        // If the list of pictures is modified and we already were displaying
        // a picture, we attempt to set the currently displayed picture
        // to this picture.
        // We fall back to the index that was already here.

        let displayedPictureIndex = -1

        const displayedPictureId = this.displayedPictureId()
        if (displayedPictureId) {
          displayedPictureIndex = imagesPreviews.findIndex(image => image.contentId === displayedPictureId)
        }

        if (displayedPictureIndex === -1) {
          displayedPictureIndex = state.displayedPictureIndex
        }

        this.setState({ imagesPreviews, displayedPictureIndex, imagesPreviewsLoaded: true })

        break
      }
      default: this.sendGlobalFlashMessage(props.t('Error while loading content list'))
    }
  }

  loadPreview = async (images) => {
    const { state, props } = this

    return (await Promise.all(images.map(async (image) => {
      const fetchFileContent = await handleFetchResult(
        await getFileContent(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId)
      )
      switch (fetchFileContent.apiResponse.status) {
        case 200: {
          if (!fetchFileContent.body.has_jpeg_preview) return false

          const filenameNoExtension = removeExtensionOfFilename(fetchFileContent.body.filename)
          const previewUrl = buildFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, 1, 1400, 1400)
          const previewUrlForThumbnail = buildFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, 1, 125, 125)
          const lightBoxUrlList = (new Array(fetchFileContent.body.page_nb)).fill('').map((n, j) =>
            buildFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, j + 1, 1920, 1920)
          )
          const rawFileUrl = buildRawFileUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.filename)

          return {
            ...image,
            src: previewUrl,
            fileName: fetchFileContent.body.filename,
            lightBoxUrlList,
            previewUrlForThumbnail,
            rotationAngle: 0,
            rawFileUrl
          }
        }
        default:
          this.sendGlobalFlashMessage(props.t('Error while loading file preview'))
          return false
      }
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
        this.sendGlobalFlashMessage(props.t('Error while loading shared space detail'))
    }
    return workspaceLabel
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  setHeadTitle = (title) => {
    const { state } = this

    if (state.config && state.config.system && state.config.system.config) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([title, state.config.system.config.instance_name]) }
      })
    }
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

    if (previousNext === DIRECTION.RIGHT && state.displayedPictureIndex === state.imagesPreviews.length - 1) nextPageNumber = 0
    if (previousNext === DIRECTION.LEFT && state.displayedPictureIndex === 0) nextPageNumber = state.imagesPreviews.length - 1

    this.setState({
      displayedPictureIndex: nextPageNumber
    })
  }

  getPreviousImageUrl = () => {
    const { state } = this

    if (state.imagesPreviews.length <= 1) return

    if (state.displayedPictureIndex === 0) return state.imagesPreviews[state.imagesPreviews.length - 1].lightBoxUrlList[0]
    return state.imagesPreviews[state.displayedPictureIndex - 1].lightBoxUrlList[0]
  }

  getNextImageUrl = () => {
    const { state } = this

    if (state.imagesPreviews.length <= 1) return

    if (state.displayedPictureIndex === state.imagesPreviews.length - 1) return state.imagesPreviews[0].lightBoxUrlList[0]
    return state.imagesPreviews[state.displayedPictureIndex + 1].lightBoxUrlList[0]
  }

  handleCarouselPositionChange = (pictureIndex) => {
    if (pictureIndex < 0) return
    this.setState({ displayedPictureIndex: pictureIndex })
  }

  handleOpenDeleteFilePopup = () => {
    this.setState({
      displayPopupDelete: true
    })
  }

  handleCloseDeleteFilePopup = () => {
    this.setState({
      displayPopupDelete: false
    })
  }

  deleteFile = async (filePosition) => {
    const { state } = this
    const putResult = await putFileIsDeleted(
      state.config.apiUrl,
      state.config.appConfig.workspaceId,
      state.imagesPreviews[filePosition].contentId
    )

    switch (putResult.status) {
      case 204:
        this.setState({
          displayPopupDelete: false
        })
        break
      case 403:
        this.sendGlobalFlashMessage(this.props.t('Insufficient permissions'))
        break
      default:
        this.sendGlobalFlashMessage(this.props.t('Error while deleting document'))
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

    if (pictureId < 0 || pictureId >= state.imagesPreviews.length || !direction) return

    if (!state.imagesPreviews[pictureId]) return

    const imagesPreviews = state.imagesPreviews
    let rotationAngle = 0
    switch (imagesPreviews[pictureId].rotationAngle) {
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
    imagesPreviews[pictureId].rotationAngle = rotationAngle
    this.setState({ imagesPreviews })
  }

  getRawFileUrlSelectedFile () {
    const { state } = this

    if (state.imagesPreviews.length === 0 || !this.currentPicture()) return

    return this.currentPicture().rawFileUrl
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
  currentPicture () {
    return this.state.imagesPreviews[this.state.displayedPictureIndex]
  }

  displayedPictureId () {
    return (this.currentPicture() || {}).contentId
  }

  render () {
    const { state, props } = this

    if (this.currentPicture()) this.lightboxRotation.changeAngle(this.currentPicture().rotationAngle)

    return (
      <div className='gallery-scrollView'>
        <PageWrapper customClass='gallery'>
          <PageTitle
            title={state.folderId ? state.folderDetail.fileName : state.workspaceLabel}
            icon='picture-o'
            breadcrumbsList={state.breadcrumbsList}
            parentClass='gallery__header'
          />

          <PageContent>
            <div className='gallery__action__button'>
              <button
                className='btn outlineTextBtn nohover primaryColorBorder gallery__action__button__play'
                onClick={() => this.onClickSlickPlay(!state.autoPlay)}
                data-cy='gallery__action__button__auto__play'
              >
                <span className='gallery__action__button__text'>
                  {state.autoPlay ? props.t('Pause') : props.t('Play')}
                </span>
                <i className={classnames('fa', 'fa-fw', state.autoPlay ? 'fa-pause' : 'fa-play')} />
              </button>

              <button
                className='btn outlineTextBtn nohover primaryColorBorder gallery__action__button__rotation__left'
                onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.LEFT)}
              >
                <span className='gallery__action__button__text'>{props.t('Rotate 90° left')}</span>
                <i className='fa fa-fw fa-undo' />
              </button>

              <button
                className='btn outlineTextBtn nohover primaryColorBorder gallery__action__button__rotation__right'
                onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.RIGHT)}
              >
                <span className='gallery__action__button__text'>{props.t('Rotate 90° right')}</span>
                <i className='fa fa-fw fa-undo' />
              </button>

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <button
                  className='btn outlineTextBtn nohover primaryColorBorder gallery__action__button__delete'
                  onClick={this.handleOpenDeleteFilePopup}
                  data-cy='gallery__action__button__delete'
                >
                  <span className='gallery__action__button__text'>{props.t('Delete')}</span><i className='fa fa-fw fa-trash' />
                </button>
              )}
            </div>

            {(state.imagesPreviewsLoaded
              ? (
                <Carousel
                  fileSelected={state.displayedPictureIndex}
                  slides={state.imagesPreviews}
                  onCarouselPositionChange={this.handleCarouselPositionChange}
                  onClickShowImageRaw={this.handleClickShowImageRaw}
                  disableAnimation={state.displayLightbox}
                  isWorkspaceRoot={state.folderId === 0}
                  autoPlay={state.autoPlay}
                />
              ) : (
                <div className='gallery__loader'>
                  <i className='fa fa-spinner fa-spin gallery__loader__icon' />
                </div>
              )
            )}

            <Fullscreen
              enabled={state.fullscreen}
              onChange={fullscreen => this.setState({ fullscreen })}
            >
              <div ref={modalRoot => (this.reactImageLightBoxModalRoot = modalRoot)} />

              {state.displayLightbox && this.currentPicture() && (
                <div className='gallery__mouse__listener' onMouseMove={this.handleMouseMove}>
                  <ReactImageLightbox
                    prevSrc={this.getPreviousImageUrl()}
                    mainSrc={this.currentPicture().lightBoxUrlList[0]}
                    nextSrc={this.getNextImageUrl()}
                    onCloseRequest={this.handleClickHideImageRaw}
                    onMovePrevRequest={() => { this.handleClickPreviousNextPage(DIRECTION.LEFT) }}
                    onMoveNextRequest={() => { this.handleClickPreviousNextPage(DIRECTION.RIGHT) }}
                    imagePadding={0}
                    onAfterOpen={this.handleAfterOpenReactImageLightBox}
                    reactModalProps={{ parentSelector: () => this.reactImageLightBoxModalRoot }}
                    toolbarButtons={[(
                      <button
                        className='btn iconBtn'
                        onClick={() => this.onClickSlickPlay(!state.autoPlay)}
                        title={state.autoPlay ? props.t('Pause') : props.t('Play')}
                        data-cy='gallery__action__button__lightbox__auto__play'
                        key='btn_autoplay'
                      >
                        <i className={classnames('fa', 'fa-fw', state.autoPlay ? 'fa-pause' : 'fa-play')} />
                      </button>
                    ), (
                      <button
                        className='btn iconBtn'
                        onClick={() => this.setState((prevState) => ({ fullscreen: !prevState.fullscreen }))}
                        title={state.fullscreen ? props.t('Disable fullscreen') : props.t('Enable fullscreen')}
                        data-cy='gallery__action__button__lightbox__fullscreen'
                        key='btn_fullscreen'
                      >
                        <i className={classnames('fa', 'fa-fw', state.fullscreen ? 'fa-compress' : 'fa-expand')} />
                      </button>
                    ), (
                      <button
                        className='btn iconBtn'
                        onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.LEFT)}
                        title={props.t('Rotate 90° left')}
                        data-cy='gallery__action__button__lightbox__rotation__left'
                        key='btn_rotate_left'
                      >
                        <i className='fa fa-fw fa-undo' />
                      </button>
                    ), (
                      <button
                        className='btn iconBtn gallery__action__button__lightbox__rotation__right'
                        onClick={() => this.rotateImg(state.displayedPictureIndex, DIRECTION.RIGHT)}
                        title={props.t('Rotate 90° right')}
                        key='btn_rotate_right'
                      >
                        <i className='fa fa-fw fa-undo' />
                      </button>
                    ), (
                      <a
                        className='btn iconBtn gallery__action__button__lightbox__openRawContent'
                        title={props.t('Open raw file')}
                        href={this.getRawFileUrlSelectedFile()}
                        target='_blank'
                        rel='noopener noreferrer'
                        key='btn_open_raw'
                      >
                        <i className='fa fa-fw fa-download' />
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
              >
                <div className='gallery__delete__file__popup__body'>
                  <div className='gallery__delete__file__popup__body__msg'>{props.t('Are you sure?')}</div>
                  <div className='gallery__delete__file__popup__body__btn'>
                    <button
                      type='button'
                      className='btn outlineTextBtn primaryColorBorder primaryColorFont nohover'
                      onClick={this.handleCloseDeleteFilePopup}
                    >
                      {props.t('Cancel')}
                    </button>

                    <button
                      type='button'
                      className='btn highlightBtn primaryColorBg primaryColorDarkenBgHover'
                      onClick={() => this.deleteFile(this.state.displayedPictureIndex)}
                      data-cy='gallery__delete__file__popup__body__btn__delete'
                    >
                      {props.t('Delete')}
                    </button>
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
