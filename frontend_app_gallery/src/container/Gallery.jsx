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
  BREADCRUMBS_TYPE
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
import { debug, DIRECTION } from '../helper.js'
import ReactImageLightbox, { LightboxRotation } from '../Lightbox.js'
import 'react-image-lightbox/style.css'
import Fullscreen from 'react-full-screen'
import classnames from 'classnames'

const qs = require('query-string')

class Gallery extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'gallery',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      breadcrumbsList: [],
      appMounted: false,
      folderId: qs.parse(props.data.config.history.location.search).folder_ids,
      imagesPreviews: [],
      fileCurrentPage: 1,
      fileName: '',
      fileSelected: 0,
      autoPlay: null,
      fullscreen: false,
      displayPopupDelete: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    this.lightboxRotation = new LightboxRotation()

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this

    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<Gallery> Custom event', 'color: #28a745', type, data)
        const currentFolderId = qs.parse(data.config.history.location.search).folder_ids
        if (data.config.appConfig.workspaceId !== state.config.appConfig.workspaceId || currentFolderId !== state.folderId) {
          this.setState({
            config: data.config,
            folderId: currentFolderId
          })
        }
        break
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<Gallery> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.buildBreadcrumbs()
        break
      default:
        break
    }
  }

  async componentDidMount () {
    const { state } = this

    console.log('%c<Gallery> did mount', `color: ${state.config.hexcolor}`)

    if (state.folderId) await this.loadFolderDetail(state.config.appConfig.workspaceId, state.folderId)
    await this.loadGalleryList(state.config.appConfig.workspaceId, state.folderId)
    if (state.config.appConfig.workspaceId !== null) await this.loadWorkspaceData()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Gallery> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.workspaceId !== state.config.appConfig.workspaceId || prevState.folderId !== state.folderId) {
      if (state.folderId) await this.loadFolderDetail(state.config.appConfig.workspaceId, state.folderId)
      await this.loadGalleryList(state.config.appConfig.workspaceId, state.folderId)
      await this.loadWorkspaceData()
      this.buildBreadcrumbs()
    }
    if (prevState.fileSelected !== state.fileSelected) {
      this.buildBreadcrumbs()
    }
  }

  componentWillUnmount () {
    console.log('%c<Gallery> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: <Link to={'/ui'}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/dashboard`}>{state.content.workspaceLabel}</Link>,
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN
    }]
    if (state.folderId) {
      breadcrumbsList.push({
        link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/contents?folder_open=${state.folderId}`}>{state.fileName}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }
    if (state.imagesPreviews && state.imagesPreviews.length > 0) {
      breadcrumbsList.push({
        link: <Link
          to={`/ui/workspaces/${state.config.appConfig.workspaceId}/contents/file/${state.imagesPreviews[state.fileSelected].contentId}`}>{state.imagesPreviews[state.fileSelected].fileName}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({ breadcrumbsList: breadcrumbsList })
  }

  loadFolderDetail = async (workspaceId, folderId) => {
    const { state, props } = this

    const fetchContentDetail = await handleFetchResult(
      await getFolderDetail(state.config.apiUrl, workspaceId, folderId)
    )

    switch (fetchContentDetail.apiResponse.status) {
      case 200:
        this.setState({ fileName: fetchContentDetail.body.filename })
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading folder detail'))
    }
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
      case 200:
        const images = fetchContentList.body.filter(c => c.content_type === 'file').map(c => ({ src: '', contentId: c.content_id }))

        const imagesPreviews = await this.loadPreview(images)

        this.setState({ imagesPreviews })

        break
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
        case 200:
          if (!fetchFileContent.body.has_jpeg_preview) return false

          const filenameNoExtension = removeExtensionOfFilename(fetchFileContent.body.filename)
          const previewUrl = buildFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, 1, 1400, 1400)
          const previewUrlForThumbnail = buildFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, 1, 150, 150)
          const lightBoxUrlList = (new Array(fetchFileContent.body.page_nb)).fill('').map((n, j) =>
            buildFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, j + 1, 1920, 1920)
          )

          return {
            ...image,
            src: previewUrl,
            fileName: fetchFileContent.body.filename,
            lightBoxUrlList,
            previewUrlForThumbnail,
            rotationAngle: 0
          }
        default:
          this.sendGlobalFlashMessage(props.t('Error while loading file preview'))
          return {}
      }
    }))).filter(i => i !== false)
  }

  loadWorkspaceData = async () => {
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
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading shared space detail'))
    }
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleClickHideImageRaw = () => {
    this.setState({ displayLightbox: false, fullscreen: false })
  }

  handleClickShowImageRaw = () => {
    this.setState({ displayLightbox: true })
  }

  handleClickPreviousNextPage = previousNext => {
    const { state } = this

    let nextPageNumber = previousNext === DIRECTION.LEFT ? state.fileSelected - 1 : state.fileSelected + 1

    if (previousNext === DIRECTION.RIGHT && state.fileSelected === state.imagesPreviews.length - 1) nextPageNumber = 0
    if (previousNext === DIRECTION.LEFT && state.fileSelected === 0) nextPageNumber = state.imagesPreviews.length - 1

    this.setState({
      fileSelected: nextPageNumber
    })
  }

  getPreviousImageUrl = () => {
    const { state } = this

    if (state.imagesPreviews.length === 1) return

    if (state.fileSelected === 0) return state.imagesPreviews[state.imagesPreviews.length - 1].lightBoxUrlList[0]
    return state.imagesPreviews[state.fileSelected - 1].lightBoxUrlList[0]
  }

  getNextImageUrl = () => {
    const { state } = this

    if (state.imagesPreviews.length === 1) return

    if (state.fileSelected === state.imagesPreviews.length - 1) return state.imagesPreviews[0].lightBoxUrlList[0]
    return state.imagesPreviews[state.fileSelected + 1].lightBoxUrlList[0]
  }

  onCarouselPositionChange = (fileSelected) => {
    if (fileSelected < 0) return
    this.setState({ fileSelected })
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
    const contentIdToDelete = state.imagesPreviews[filePosition].contentId
    const putResult = await putFileIsDeleted(state.config.apiUrl, state.config.appConfig.workspaceId, state.imagesPreviews[filePosition].contentId)

    switch (putResult.status) {
      case 204:
        const newImagesPreviews = this.state.imagesPreviews.filter((image) => (image.contentId !== contentIdToDelete))
        this.setState({
          imagesPreviews: newImagesPreviews,
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

  rotateImg (fileSelected, direction) {
    const { state } = this

    const imagesPreviews = state.imagesPreviews
    let rotationAngle
    switch (imagesPreviews[fileSelected].rotationAngle) {
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
    imagesPreviews[fileSelected].rotationAngle = rotationAngle
    this.setState({ imagesPreviews })
  }

  render () {
    const { state, props } = this

    if (state.imagesPreviews[state.fileSelected]) this.lightboxRotation.changeAngle(state.imagesPreviews[state.fileSelected].rotationAngle)

    return (
      <PageWrapper customClass='gallery'>
        <PageTitle
          title={state.folderId ? state.fileName : state.content.workspaceLabel}
          icon={'picture-o'}
          breadcrumbsList={state.breadcrumbsList}
        />

        <PageContent>
          <div className='gallery__action__button'>
            <button className='btn outlineTextBtn nohover primaryColorBorder' onClick={() => this.onClickSlickPlay(!state.autoPlay)}>
              <span class='gallery__action__button__text'>{state.autoPlay ? props.t('Pause') : props.t('Play')}</span><i className={classnames('fa', 'fa-fw', state.autoPlay ? 'fa-pause' : 'fa-play')} />
            </button>

            <button className='btn outlineTextBtn nohover primaryColorBorder gallery__action__button__rotation__left' onClick={() => this.rotateImg(state.fileSelected, DIRECTION.LEFT)}>
              <span className='gallery__action__button__text'>{props.t('Rotate left')}</span><i className={'fa fa-fw fa-reply'} />
            </button>

            <button className='btn outlineTextBtn nohover primaryColorBorder gallery__action__button__rotation__right' onClick={() => this.rotateImg(state.fileSelected, DIRECTION.RIGHT)}>
              <span className='gallery__action__button__text'>{props.t('Rotate right')}</span><i className={'fa fa-fw fa-share'} />
            </button>

            {/*
              INFO - CH - there is a bug with the property userRoleIdInWorkspace that comes from frontend, it might be it's default value which is 1
              So we won't use it for now and always display the delete button which will return 401 if user can't delete content
            */}
            <button className='btn outlineTextBtn nohover primaryColorBorder' onClick={this.handleOpenDeleteFilePopup}>
              <span className='gallery__action__button__text'>{props.t('Delete')}</span><i className={'fa fa-fw fa-trash'} />
            </button>
          </div>

          <Carousel
            fileSelected={state.fileSelected}
            slides={state.imagesPreviews}
            onCarouselPositionChange={this.onCarouselPositionChange}
            handleClickShowImageRaw={this.handleClickShowImageRaw}
            loggedUser={state.loggedUser}
            disableAnimation={state.displayLightbox}
          />

          <Fullscreen
            enabled={this.state.fullscreen}
            onChange={fullscreen => this.setState({ fullscreen })}
          >
            <div ref={modalRoot => (this.modalRoot = modalRoot)} />
          </Fullscreen>

          {state.displayLightbox && (
            <ReactImageLightbox
              prevSrc={this.getPreviousImageUrl()}
              mainSrc={state.imagesPreviews[state.fileSelected].lightBoxUrlList[0]}
              nextSrc={this.getNextImageUrl()}
              onCloseRequest={this.handleClickHideImageRaw}
              onMovePrevRequest={() => { this.handleClickPreviousNextPage(DIRECTION.LEFT) }}
              onMoveNextRequest={() => { this.handleClickPreviousNextPage(DIRECTION.RIGHT) }}
              imagePadding={10}
              reactModalProps={{ parentSelector: () => this.modalRoot }}
              toolbarButtons={[
                <div className={'gallery__action__button__lightbox'}>
                  <button
                    className={'btn iconBtn'}
                    onClick={() => this.onClickSlickPlay(!state.autoPlay)}
                    title={state.autoPlay ? props.t('Pause') : props.t('Play')}
                  >
                    <i className={classnames('fa', 'fa-fw', state.autoPlay ? 'fa-pause' : 'fa-play')} />
                  </button>

                  <button
                    className={'btn iconBtn'}
                    onClick={() => this.setState((prevState) => ({ fullscreen: !prevState.fullscreen }))}
                    title={state.fullscreen ? props.t('Disable fullscreen') : props.t('Enable fullscreen')}
                  >
                    <i className={classnames('fa', 'fa-fw', state.fullscreen ? 'fa-compress' : 'fa-expand')} />
                  </button>

                  <button
                    className='btn iconBtn gallery__action__button__rotation__left'
                    onClick={() => this.rotateImg(state.fileSelected, DIRECTION.LEFT)}
                    title={props.t('Rotate left')}
                  >
                    <i className={'fa fa-fw fa-reply'} />
                  </button>

                  <button
                    className='btn iconBtn gallery__action__button__rotation__right'
                    onClick={() => this.rotateImg(state.fileSelected, DIRECTION.RIGHT)}
                    title={props.t('Rotate right')}
                  >
                    <i className={'fa fa-fw fa-share'} />
                  </button>
                </div>
              ]}
            />
          )}

          {state.displayPopupDelete && (
            <CardPopup
              customClass='gallery__delete__file__popup'
              customHeaderClass='primaryColorBg'
              onClose={this.handleCloseDeleteFilePopup}
            >
              <div className='gallery__delete__file__popup__body'>
                <div className='gallery__delete__file__popup__body__msg'>{props.t('Are you sure ?')}</div>
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
                    onClick={() => this.deleteFile(this.state.fileSelected)}
                  >
                    {props.t('Delete')}
                  </button>
                </div>
              </div>
            </CardPopup>
          )}
        </PageContent>
      </PageWrapper>
    )
  }
}

export default translate()(Gallery)
