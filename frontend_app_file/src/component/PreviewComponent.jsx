import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import PropTypes from 'prop-types'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'
import { Icon, IMG_LOAD_STATE } from 'tracim_frontend_lib'

require('./PreviewComponent.styl')

export class PreviewComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayLightbox: false,
      jpegPreviewLoadingState: IMG_LOAD_STATE.LOADING
      // isPdfPageDisplayable: true,
      // isPdfFullDisplayable: true
    }
  }

  componentDidMount () {
    this.isjpegPreviewLoadingState()
    // this.isPdfPageDisplayable()
    // this.isPdfFullDisplayable()
  }

  componentDidUpdate (prevProps) {
    const { props, state } = this

    if (prevProps.preview.url !== props.preview.url && state.displayLightbox === false) {
      this.setState({ jpegPreviewLoadingState: IMG_LOAD_STATE.LOADING })
      this.isjpegPreviewLoadingState()
    }
    // if (prevProps.downloadPdfPageUrl !== props.downloadPdfPageUrl) {
    //   this.setState({ isPdfPageDisplayable: true })
    //   this.isPdfPageDisplayable()
    // }
    // if (prevProps.downloadPdfFullUrl !== props.downloadPdfFullUrl) {
    //   this.setState({ isPdfFullDisplayable: true })
    //   this.isPdfFullDisplayable()
    // }
  }

  handleClickShowImageRaw = () => {
    this.setState({ displayLightbox: true })
  }

  handleClickHideImageRaw = () => {
    this.setState({ displayLightbox: false })
  }

  isjpegPreviewLoadingState = () => {
    const { props } = this

    if (props.isJpegAvailable) {
      const img = document.createElement('img')
      img.src = props.preview.url
      img.onerror = () => this.setState({ jpegPreviewLoadingState: IMG_LOAD_STATE.ERROR })
      img.onload = () => this.setState({ jpegPreviewLoadingState: IMG_LOAD_STATE.LOADED })
    }
  }

  // Côme - 2018/11/14 - As long as we don't have a complete knowledge of what works and what don't about preview generator
  // we assume that if jpeg fails, pdf will too
  // isPdfPageDisplayable = async () => {
  //   const { props } = this
  //
  //   if (props.isPdfAvailable) {
  //     const fetchPdfPage = await handleFetchResult(await getFilePdf(props.downloadPdfPageUrl))
  //     if (fetchPdfPage.status !== 200) this.setState({ isPdfPageDisplayable: false })
  //   }
  // }
  //
  // isPdfFullDisplayable = async () => {
  //   const { props } = this
  //
  //   if (props.isPdfAvailable) {
  //     const fetchPdfFull = await handleFetchResult(await getFilePdf(props.downloadPdfFullUrl))
  //     if (fetchPdfFull.status !== 200) this.setState({ isPdfFullDisplayable: false })
  //   }
  // }

  handleClickPreview = () => {
    const { props, state } = this
    if (props.isVideo) {
      this.props.onTogglePreviewVideo()
    } else if (state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED && props.isJpegAvailable) {
      this.handleClickShowImageRaw()
    }
  }

  render () {
    const { props, state } = this

    let srcSet = ''
    props.previewList.map((entry, index, arr) => {
      srcSet = srcSet + `${entry.url} ${entry.size}${index === arr.length - 1 ? '' : ', '}`
    })

    return (
      <div className='previewcomponent'>
        <div className='previewcomponent__filepreview'>
          {state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED && props.filePageNb > 1 && !props.isVideo && (
            <button
              type='button'
              className='previewcomponent__navigationButton btn iconBtn'
              onClick={props.onClickPreviousPage}
              style={{ ':hover': { color: props.color } }}
              title={props.t('Previous page')}
              disabled={props.fileCurrentPage === 1}
              key='file_btn_previouspage'
            >
              <i className='fas fa-chevron-left' />
            </button>
          )}

          <div
            className={classnames(
              'previewcomponent__fileimg',
              { previewAvailable: state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED && props.isJpegAvailable }
            )}
            onClick={this.handleClickPreview}
          >
            {(props.isJpegAvailable && state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED
              ? (
                <>
                  <img
                    src={props.preview.url}
                    srcSet={srcSet}
                    alt={props.preview.name}
                    className='img-thumbnail previewcomponent__fileimg__img'
                  />

                  {props.isVideo && (
                    <div className='previewcomponent__fileimg__play'>
                      <Icon
                        icon='far fa-play-circle'
                        title={props.t('Play video')}
                      />
                    </div>
                  )}
                </>
              )
              : (
                <div className='previewcomponent__fileimg__text'>
                  {props.isJpegAvailable && state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADING
                    ? (
                      <div className='previewcomponent__fileimg__text-msg'>
                        {props.t('Preview loading...')}
                      </div>
                    )
                    : (
                      <>
                        <i className='previewcomponent__fileimg__text-icon far fa-eye-slash' style={{ color: props.color }} />
                        <div className='previewcomponent__fileimg__text-msg'>
                          {props.t('No preview available')}
                        </div>
                      </>
                    )}
                </div>
              )
            )}

            {(state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED && props.isJpegAvailable && state.displayLightbox
              ? (
                <Lightbox
                  prevSrc={props.lightboxUrlList[props.fileCurrentPage - 2]}
                  mainSrc={props.lightboxUrlList[props.fileCurrentPage - 1]} // INFO - CH - 2019-07-09 - fileCurrentPage starts at 1
                  nextSrc={props.lightboxUrlList[props.fileCurrentPage]}
                  onCloseRequest={this.handleClickHideImageRaw}
                  onMovePrevRequest={props.onClickPreviousPage}
                  onMoveNextRequest={props.onClickNextPage}
                  imageCaption={`${props.fileCurrentPage} ${props.t('of')} ${props.filePageNb}`}
                  imagePadding={55}
                />
              )
              : null
            )}
          </div>

          {state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED && props.filePageNb > 1 && !props.isVideo && (
            <button
              type='button'
              className='previewcomponent__navigationButton btn transparentButton'
              onClick={props.onClickNextPage}
              style={{ ':hover': { color: props.color } }}
              title={props.t('Next page')}
              disabled={props.fileCurrentPage === props.filePageNb}
              key='file_btn_nextpage'
            >
              <i className='fas fa-chevron-right' />
            </button>
          )}
        </div>
        {state.jpegPreviewLoadingState === IMG_LOAD_STATE.LOADED && props.filePageNb > 1 && !props.isVideo && (
          <div className='previewcomponent__pagecount'>
            {props.fileCurrentPage}{props.t(' of ')}{props.filePageNb}
          </div>
        )}
      </div>
    )
  }
}

export default translate()(Radium(PreviewComponent))

PreviewComponent.propTypes = {
  filePageNb: PropTypes.number,
  fileCurrentPage: PropTypes.number,
  isJpegAvailable: PropTypes.bool,
  isPdfAvailable: PropTypes.bool,
  isVideo: PropTypes.bool,
  previewList: PropTypes.array,
  preview: PropTypes.object,
  downloadPdfPageUrl: PropTypes.string,
  color: PropTypes.string,
  onClickPreviousPage: PropTypes.func,
  onClickNextPage: PropTypes.func,
  lightboxUrlList: PropTypes.array,
  onTogglePreviewVideo: PropTypes.func

}

PreviewComponent.defaultProps = {
  filePageNb: 0,
  fileCurrentPage: 0,
  isJpegAvailable: false,
  isPdfAvailable: true,
  isVideo: false,
  previewList: [],
  downloadPdfPageUrl: '',
  color: '',
  onClickPreviousPage: () => { },
  onClickNextPage: () => { },
  lightboxUrlList: [],
  onTogglePreviewVideo: () => { }
}
