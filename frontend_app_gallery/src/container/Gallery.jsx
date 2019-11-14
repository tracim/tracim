import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  CUSTOM_EVENT,
  PageTitle,
  PageWrapper,
  PageContent,
  handleFetchResult,
  BREADCRUMBS_TYPE
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import { Link } from 'react-router-dom'
import { getFolderContentList, getWorkspaceDetail, getFileContent, getFolderDetail } from '../action.async'
import Carousel from '../component/Carousel.jsx'
import { removeExtensionOfFilename, getPreviewUrl } from '../helper.js'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'

class Gallery extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'gallery',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      userWorkspaceList: [],
      userWorkspaceListLoaded: false,
      breadcrumbsList: [],
      appMounted: false,
      imagesPreviews: [],
      carouselPosition: 0,
      fileCurrentPage: 1,
      fileName: 'unknown'
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
          this.setState({config: data.config})
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

    await this.loadFolderDetail(state.config.appConfig.workspaceId, state.config.appConfig.idFolder)
    await this.loadGalleryList(state.config.appConfig.workspaceId, state.config.appConfig.idFolder)
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
    }]

    breadcrumbsList.push({
      link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/dashboard`}>{state.content.workspaceLabel}</Link>,
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN
    }, {
      link: <Link to={`/ui/workspaces/${state.config.appConfig.workspaceId}/gallery/${state.config.appConfig.idFolder}`}>{state.fileName}</Link>,
      type: BREADCRUMBS_TYPE.APP_FULLSCREEN
    })

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({breadcrumbsList: breadcrumbsList})
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

    const fetchContentList = await handleFetchResult(
      await getFolderContentList(state.config.apiUrl, workspaceId, folderId)
    )

    switch (fetchContentList.apiResponse.status) {
      case 200:
        let imagesPreviews = []
        fetchContentList.body.forEach(content => {
          if (content.content_type === 'file') {
            imagesPreviews.push({ src: '', contentId: content.content_id})
          }
        })
        await this.loadFirstPreview(imagesPreviews)
        this.setState({ imagesPreviews })

        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading shared space list'))
    }
  }

  loadFirstPreview = async (imagesPreviews) => {
    const { state, props } = this

    // FIXME use global const
    const pageForPreview = 1
    const firstPreviews = (imagesPreviews.length < 3) ? imagesPreviews.length : 3
    for (let i = 0; i < firstPreviews; i++) {
      const fetchFileContent = await handleFetchResult(
        await getFileContent(state.config.apiUrl, state.config.appConfig.workspaceId, imagesPreviews[i].contentId)
      )
      switch (fetchFileContent.apiResponse.status) {
        case 200:
          const filenameNoExtension = removeExtensionOfFilename(fetchFileContent.body.filename)
          const previewUrl = getPreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, imagesPreviews[i].contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, pageForPreview, 700, 500)
          const lightBoxUrlList = (new Array(fetchFileContent.body.page_nb)).fill('').map((n, j) =>
            // FIXME - b.l - refactor urls
            `${state.config.apiUrl}/workspaces/${state.config.appConfig.workspaceId}/files/${imagesPreviews[i].contentId}/revisions/${fetchFileContent.body.current_revision_id}/preview/jpg/1920x1080/${filenameNoExtension + '.jpg'}?page=${j + 1}`
          )

          imagesPreviews[i] = {
            ...imagesPreviews[i],
            src: previewUrl,
            fileName: fetchFileContent.body.filename,
            lightBoxUrlList
          }
        // default: this.sendGlobalFlashMessage(props.t('Error while loading file content'))
      }
    }
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
      // default: this.sendGlobalFlashMessage(props.t('Error while loading shared space detail'))
    }
  }

  onCarouselPositionChange = async (position) => {
    const { state } = this
    const imageIndexToLoad = position + 2
    if (!state.imagesPreviews[imageIndexToLoad] || state.imagesPreviews[imageIndexToLoad].src != '' || state.carouselPosition > position) {
      this.setState({ carouselPosition: position })
      return
    }

    const fetchFileContent = await handleFetchResult(
      await getFileContent(state.config.apiUrl, state.config.appConfig.workspaceId, this.state.imagesPreviews[imageIndexToLoad].contentId)
    )
    switch (fetchFileContent.apiResponse.status) {
      case 200:
        const filenameNoExtension = removeExtensionOfFilename(fetchFileContent.body.filename)
        const previewUrl = getPreviewUrl(state.config.apiUrl, state.config.appConfig.workspaceId, state.imagesPreviews[imageIndexToLoad].contentId, fetchFileContent.body.current_revision_id, filenameNoExtension, 1, 700, 500)
        const lightBoxUrlList = (new Array(fetchFileContent.body.page_nb)).fill('').map((n, i) =>
          // FIXME - b.l - refactor urls
          `${state.config.apiUrl}/workspaces/${state.config.appConfig.workspaceId}/files/${state.imagesPreviews[imageIndexToLoad].contentId}/revisions/${fetchFileContent.body.current_revision_id}/preview/jpg/1920x1080/${filenameNoExtension + '.jpg'}?page=${i + 1}`
        )
        let imagesPreviews = [...this.state.imagesPreviews]
        imagesPreviews[imageIndexToLoad].src = previewUrl
        imagesPreviews[imageIndexToLoad].fileName = fetchFileContent.body.filename
        imagesPreviews[imageIndexToLoad].lightBoxUrlList = lightBoxUrlList
        this.setState({ imagesPreviews, carouselPosition: position })
      // default:
      //   this.sendGlobalFlashMessage(props.t('Error while loading file content'))
    }
  }

  handleClickHideImageRaw = () => {
    this.setState({ displayLightbox: false })
  }

  handleClickShowImageRaw = () => {
    this.setState({ displayLightbox: true })
  }

  handleClickPreviousNextPage = previousNext => {
    const { state } = this

    if (!['previous', 'next'].includes(previousNext)) return
    if (previousNext === 'previous' && state.fileCurrentPage === 0) return
    if (previousNext === 'next' && state.fileCurrentPage > state.imagesPreviews[state.carouselPosition].lightBoxUrlList.length) return

    const nextPageNumber = previousNext === 'previous' ? state.fileCurrentPage - 1 : state.fileCurrentPage + 1

    this.setState(prev => ({
      fileCurrentPage: nextPageNumber,
    }))
  }

  render () {
    const { state } = this
    return (
      <div>
        <PageWrapper customClass='agendaPage'>
          <PageTitle
            parentClass='galleryPage'
            title={state.fileName}
            icon={'picture-o'}
            breadcrumbsList={state.breadcrumbsList}
          />

          <PageContent parentClass='agendaPage'>
            <Carousel
              selectedItem={state.carouselPosition}
              slides={state.imagesPreviews}
              onCarouselPositionChange={this.onCarouselPositionChange}
              handleClickShowImageRaw={this.handleClickShowImageRaw}
            />

            {state.displayLightbox
              ? (
                <Lightbox
                  prevSrc={state.imagesPreviews[state.carouselPosition].lightBoxUrlList[state.fileCurrentPage - 2]}
                  mainSrc={state.imagesPreviews[state.carouselPosition].lightBoxUrlList[state.fileCurrentPage - 1]} // INFO - CH - 2019-07-09 - fileCurrentPage starts at 1
                  nextSrc={state.imagesPreviews[state.carouselPosition].lightBoxUrlList[state.fileCurrentPage]}
                  onCloseRequest={this.handleClickHideImageRaw}
                  onMovePrevRequest={() => {this.handleClickPreviousNextPage('previous')}}
                  onMoveNextRequest={() => {this.handleClickPreviousNextPage('next')}}
                  // imageCaption={`${props.fileCurrentPage} ${props.t('of')} ${props.filePageNb}`}
                  imagePadding={55}
                />
              )
              : null
            }
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

export default translate()(Gallery)
