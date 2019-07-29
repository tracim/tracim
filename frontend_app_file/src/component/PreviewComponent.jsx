import React from 'react'
import classnames from 'classnames'
import { withTranslation } from 'react-i18next'
import Radium from 'radium'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'

require('./PreviewComponent.styl')

export class PreviewComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayLightbox: false,
      isJpegPreviewDisplayable: true
      // isPdfPageDisplayable: true,
      // isPdfFullDisplayable: true
    }
  }

  componentDidMount () {
    this.isJpegPreviewDisplayable()
    // this.isPdfPageDisplayable()
    // this.isPdfFullDisplayable()
  }

  componentDidUpdate (prevProps) {
    const { props, state } = this

    if (prevProps.previewUrl !== props.previewUrl && state.displayLightbox === false) {
      this.setState({ isJpegPreviewDisplayable: true })
      this.isJpegPreviewDisplayable()
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

  isJpegPreviewDisplayable = () => {
    const { props } = this

    if (props.isJpegAvailable) {
      const img = document.createElement('img')
      img.src = props.previewUrl
      img.onerror = () => this.setState({ isJpegPreviewDisplayable: false })
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

  render () {
    const { props, state } = this

    return (
      <div className='previewcomponent'>
        <div className='previewcomponent__dloption'>
          {state.isJpegPreviewDisplayable && props.isPdfAvailable && (
            <a
              className='previewcomponent__dloption__icon btn iconBtn'
              href={props.downloadPdfPageUrl}
              target='_blank'
              download
              style={{ ':hover': { color: props.color } }}
              title={props.t('Download current page as PDF')}
              key={'file_btn_dl_pdfall'}
            >
              <i className='fa fa-file-o' />
            </a>
          )}

          {state.isJpegPreviewDisplayable && props.isPdfAvailable && (
            <a
              className='previewcomponent__dloption__icon btn iconBtn'
              href={props.downloadPdfFullUrl}
              target='_blank'
              download
              style={{ ':hover': { color: props.color } }}
              title={props.t('Download as PDF')}
              key={'file_btn_dl_pdfpage'}
            >
              <i className='fa fa-file-pdf-o' />
            </a>
          )}

          <a
            className='previewcomponent__dloption__icon btn iconBtn'
            href={props.downloadRawUrl}
            target='_blank'
            download
            style={{ ':hover': { color: props.color } }}
            title={props.t('Download file')}
            key={'file_btn_dl_raw'}
          >
            <i className='fa fa-download' />
          </a>
        </div>

        {state.isJpegPreviewDisplayable && props.filePageNb > 1 && (
          <button
            type='button'
            className='previewcomponent__icon btn iconBtn'
            onClick={props.onClickPreviousPage}
            style={{':hover': {color: props.color}}}
            title={props.t('Previous page')}
            disabled={props.fileCurrentPage === 1}
            key={'file_btn_previouspage'}
          >
            <i className='fa fa-chevron-left' />
          </button>
        )}

        <div
          className={
            classnames('previewcomponent__fileimg', {'previewAvailable': state.isJpegPreviewDisplayable && props.isJpegAvailable})
          }
          onClick={state.isJpegPreviewDisplayable && props.isJpegAvailable ? this.handleClickShowImageRaw : () => {}}
        >
          {state.isJpegPreviewDisplayable && props.isJpegAvailable
            ? (
              <img src={props.previewUrl} className='img-thumbnail mx-auto' />
            )
            : (
              <div className='filecontent__preview' drop='true'>
                <i className='filecontent__preview__nopreview-icon fa fa-eye-slash' style={{color: props.color}} />
                <div className='filecontent__preview__nopreview-msg'>
                  {props.t('No preview available')}
                </div>
              </div>
            )
          }

          {state.isJpegPreviewDisplayable && props.isJpegAvailable && state.displayLightbox
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
          }
        </div>

        {state.isJpegPreviewDisplayable && props.filePageNb > 1 && (
          <button
            type='button'
            className='previewcomponent__icon btn iconBtn'
            onClick={props.onClickNextPage}
            style={{':hover': {color: props.color}}}
            title={props.t('Next page')}
            disabled={props.fileCurrentPage === props.filePageNb}
            key={'file_btn_nextpage'}
          >
            <i className='fa fa-chevron-right' />
          </button>
        )}

        {state.isJpegPreviewDisplayable && props.filePageNb > 1 && (
          <div className='previewcomponent__pagecount'>
            {props.fileCurrentPage}{props.t(' of ')}{props.filePageNb}
          </div>
        )}
      </div>
    )
  }
}

export default withTranslation()(Radium(PreviewComponent))
