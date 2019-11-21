import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  getFilePreviewUrl,
  CUSTOM_EVENT,
  PageTitle,
  PageWrapper,
  PageContent,
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
import { removeExtensionOfFilename, debug } from '../helper.js'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import Lightbox from 'react-image-lightbox'
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
      fileName: 'unknown',
      fileSelected: 0,
      autoPlay: null,
      fullscreen: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this

    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<Gallery> Custom event', 'color: #28a745', type, data)
        if (data.config.appConfig.workspaceId !== state.config.appConfig.workspaceId) {
          this.setState({ config: data.config })
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

    if (prevState.config.appConfig.workspaceId !== state.config.appConfig.workspaceId) {
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
        link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/gallery?folder_ids=${state.folderId}`}>{state.fileName}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }
    breadcrumbsList.push({
      link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/contents/file/${state.imagesPreviews[state.fileSelected].contentId}`}>{state.imagesPreviews[state.fileSelected].fileName}</Link>,
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN
    })

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
        let images = []
        fetchContentList.body.forEach(content => {
          if (content.content_type === 'file') {
            images.push({ src: '', contentId: content.content_id })
          }
        })
        const imagesPreviews = await this.loadPreview(images)

        this.setState({ imagesPreviews })

        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading shared space list'))
    }
  }

  loadPreview = async (images) => {
    const { state } = this

    // FIXME use global const
    const pageForPreview = 1
    return Promise.all(images.map(async (image) => {
      const fetchFileContent = await handleFetchResult(
        await getFileContent(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId)
      )
      switch (fetchFileContent.apiResponse.status) {
        case 200:
          const filenameNoExtension = removeExtensionOfFilename(fetchFileContent.body.filename)
          const previewUrl = getFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, pageForPreview, 1400, 500)
          const previewUrlForThumbnail = getFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, pageForPreview, 150, 150)
          const lightBoxUrlList = (new Array(fetchFileContent.body.page_nb)).fill('').map((n, j) =>
            getFilePreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, image.contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, j + 1, 1920, 1080)
          )

          return ({
            ...image,
            src: previewUrl,
            fileName: fetchFileContent.body.filename,
            lightBoxUrlList,
            previewUrlForThumbnail
          })
        // default: this.sendGlobalFlashMessage(props.t('Error while loading file content'))
      }
    }))
  }

  loadWorkspaceData = async () => {
    const { state } = this

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
      // default: this.sendGlobalFlashMessage(props.t('Error while loading shared space detail'))
    }
  }

  handleClickHideImageRaw = () => {
    this.setState({ displayLightbox: false, fullscreen: false })
  }

  handleClickShowImageRaw = (fileSelected) => {
    this.setState({ displayLightbox: true, fileSelected })
  }

  handleClickPreviousNextPage = previousNext => {
    const { state } = this

    if (!['previous', 'next'].includes(previousNext)) return

    let nextPageNumber = previousNext === 'previous' ? state.fileSelected - 1 : state.fileSelected + 1

    if (previousNext === 'next' && state.fileSelected === state.imagesPreviews.length - 1) nextPageNumber = 0
    if (previousNext === 'previous' && state.fileSelected === 0) nextPageNumber = state.imagesPreviews.length - 1

    this.setState({
      fileSelected: nextPageNumber
    })
  }

  getPreviousImage = () => {
    const { state } = this

    if (state.imagesPreviews.length === 1) return

    if (state.fileSelected === 0) return state.imagesPreviews[state.imagesPreviews.length - 1].lightBoxUrlList[0]
    return state.imagesPreviews[state.fileSelected - 1].lightBoxUrlList[0]
  }

  getNextImage = () => {
    const { state } = this

    if (state.imagesPreviews.length === 1) return

    if (state.fileSelected === state.imagesPreviews.length - 1) return state.imagesPreviews[0].lightBoxUrlList[0]
    return state.imagesPreviews[state.fileSelected + 1].lightBoxUrlList[0]
  }

  onCarouselPositionChange = (fileSelected) => {
    this.setState({ fileSelected })
  }

  deleteFile = async (filePosition) => {
    const { state } = this
    const contentIdToDelete = state.imagesPreviews[filePosition].contentId
    const putResult = await handleFetchResult(
      await putFileIsDeleted(state.config.apiUrl, state.config.appConfig.workspaceId, state.imagesPreviews[filePosition].contentId)
    )
    switch (putResult.status) {
      case 204:
        const newImagesPreviews = this.state.imagesPreviews.filter((image) => (image.contentId !== contentIdToDelete))
        this.setState({
          imagesPreviews: newImagesPreviews
        })
        break
      default:
    }
  }

  onSlickPlayClick (play) {
    if (play) {
      this.setState({
        autoPlay: setInterval(() => this.handleClickPreviousNextPage('next'), 3000)
      })
    } else {
      clearInterval(this.state.autoPlay)
      this.setState({
        autoPlay: null
      })
    }
  }

  render () {
    const { state } = this
    return (
      <PageWrapper customClass='galleryPage'>
        <PageTitle
          title={state.folderId ? state.fileName : state.content.workspaceLabel}
          icon={'picture-o'}
          breadcrumbsList={state.breadcrumbsList}
        />

        <PageContent>
          <div className={'gallery__action__button'}>
            {!state.autoPlay ? (
              <button className={'btn iconBtn'} onClick={() => this.onSlickPlayClick(true)} title={'Play'}>
                <i className={'fa fa-fw fa-play'} />
              </button>
            ) : (
              <button className={'btn iconBtn'} onClick={() => this.onSlickPlayClick(false)} title={'Pause'}>
                <i className={'fa fa-fw fa-pause'} />
              </button>
            )}
          </div>

          <Carousel
            fileSelected={state.fileSelected}
            slides={state.imagesPreviews}
            onCarouselPositionChange={this.onCarouselPositionChange}
            handleClickShowImageRaw={this.handleClickShowImageRaw}
            onFileDeleted={this.deleteFile}
            loggedUser={state.loggedUser}
            disableAnimation={state.displayLightbox}
          />
          <Fullscreen
            enabled={this.state.fullscreen}
            onChange={fullscreen => this.setState({ fullscreen })}
          >
            <div ref={modalRoot => (this.modalRoot = modalRoot)} />
          </Fullscreen>
          {state.displayLightbox
            ? (
              <Lightbox
                prevSrc={this.getPreviousImage()}
                mainSrc={state.imagesPreviews[state.fileSelected].lightBoxUrlList[0]} // INFO - CH - 2019-07-09 - fileCurrentPage starts at 1
                nextSrc={this.getNextImage()}
                onCloseRequest={this.handleClickHideImageRaw}
                onMovePrevRequest={() => { this.handleClickPreviousNextPage('previous') }}
                onMoveNextRequest={() => { this.handleClickPreviousNextPage('next') }}
                // imageCaption={`${props.fileCurrentPage} ${props.t('of')} ${props.filePageNb}`}
                imagePadding={10}
                wrapperClassName={'maclass'}
                reactModalProps={{ parentSelector: () => this.modalRoot }}
                toolbarButtons={[
                  <div className={'gallery__action__button__lightbox'}>
                    <button className={'btn iconBtn'} onClick={() => this.onSlickPlayClick(!state.autoPlay)} title={'Pause'}>
                      <i className={classnames('fa', 'fa-fw', state.autoPlay ? 'fa-pause' : 'fa-play')} />
                    </button>

                    <button className={'btn iconBtn'} onClick={() => this.setState((prevState) => ({ fullscreen: !prevState.fullscreen }))} title={'Fullscreen active'}>
                      <i className={'fa fa-fw fa-arrows-alt'} />
                    </button>
                  </div>
                ]}
              />
            )
            : null
          }
        </PageContent>
      </PageWrapper>
    )
  }
}

export default translate()(Gallery)
