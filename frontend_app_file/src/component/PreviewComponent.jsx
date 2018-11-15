import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import Lightbox from 'react-images'

require('./PreviewComponent.styl')

export class PreviewComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayFormNewDescription: false,
      newDescription: '',
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
    const { props } = this

    if (prevProps.previewUrl !== props.previewUrl) {
      this.setState({isJpegPreviewDisplayable: true})
      this.isJpegPreviewDisplayable()
    }
    // if (prevProps.downloadPdfPageUrl !== props.downloadPdfPageUrl) {
    //   this.setState({isPdfPageDisplayable: true})
    //   this.isPdfPageDisplayable()
    // }
    // if (prevProps.downloadPdfFullUrl !== props.downloadPdfFullUrl) {
    //   this.setState({isPdfFullDisplayable: true})
    //   this.isPdfFullDisplayable()
    // }
  }

  handleToggleFormNewDescription = () => this.setState(prev => ({
    displayFormNewDescription: !prev.displayFormNewDescription,
    newDescription: this.props.description
  }))

  handleChangeDescription = e => this.setState({newDescription: e.target.value})

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({displayFormNewDescription: false})
  }

  handleClickShowImageRaw = async () => {
    this.setState({displayLightbox: true})
  }

  isJpegPreviewDisplayable = () => {
    const { props } = this

    if (props.isJpegAvailable) {
      const img = document.createElement('img')
      img.src = props.previewUrl
      img.onerror = () => this.setState({isJpegPreviewDisplayable: false})
    }
  }

  // Côme - 2018/11/14 - As long as we don't have a complete knowledge of what works and what don't about preview generator
  // we assume that if jpeg fails, pdf will too
  // isPdfPageDisplayable = async () => {
  //   const { props } = this
  //
  //   if (props.isPdfAvailable) {
  //     const fetchPdfPage = await handleFetchResult(await getFilePdf(props.downloadPdfPageUrl))
  //     if (fetchPdfPage.status !== 200) this.setState({isPdfPageDisplayable: false})
  //   }
  // }
  //
  // isPdfFullDisplayable = async () => {
  //   const { props } = this
  //
  //   if (props.isPdfAvailable) {
  //     const fetchPdfFull = await handleFetchResult(await getFilePdf(props.downloadPdfFullUrl))
  //     if (fetchPdfFull.status !== 200) this.setState({isPdfFullDisplayable: false})
  //   }
  // }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('previewcomponent', {'closedproperty': !props.displayProperty})}>
        <div className='previewcomponent__dloption'>
          {state.isJpegPreviewDisplayable && props.isPdfAvailable && (
            <a
              className='previewcomponent__dloption__icon btn iconBtn'
              href={props.downloadPdfPageUrl}
              target='_blank'
              download
              style={{':hover': {color: props.color}}}
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
              style={{':hover': {color: props.color}}}
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
            style={{':hover': {color: props.color}}}
            title={props.t('Download file')}
            key={'file_btn_dl_raw'}
          >
            <i className='fa fa-download' />
          </a>
        </div>

        <div className='previewcomponent__slider'>
          {state.isJpegPreviewDisplayable && props.filePageNb > 1 && (
            <button
              type='button'
              className='previewcomponent__slider__icon btn iconBtn'
              onClick={props.onClickPreviousPage}
              style={{':hover': {color: props.color}}}
              title={'Previous page'}
              disabled={props.fileCurrentPage === 1}
              key={'file_btn_previouspage'}
            >
              <i className='fa fa-chevron-left' />
            </button>
          )}

          <div
            className={
              classnames('previewcomponent__slider__fileimg', {'previewAvailable': state.isJpegPreviewDisplayable && props.isJpegAvailable})
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

            {state.isJpegPreviewDisplayable && props.isJpegAvailable && (
              <Lightbox
                isOpen={state.displayLightbox}
                images={(props.lightboxUrlList || []).map(url => ({src: url}))}
                currentImage={props.fileCurrentPage - 1}
                onClose={() => this.setState({displayLightbox: false})}
                onClickPrev={props.onClickPreviousPage}
                onClickNext={props.onClickNextPage}
                showImageCount
                imageCountSeparator={props.t(' of ')}
              />
            )}
          </div>

          {state.isJpegPreviewDisplayable && props.filePageNb > 1 && (
            <button
              type='button'
              className='previewcomponent__slider__icon btn iconBtn'
              onClick={props.onClickNextPage}
              style={{':hover': {color: props.color}}}
              title={'Next page'}
              disabled={props.fileCurrentPage === props.filePageNb}
              key={'file_btn_nextpage'}
            >
              <i className='fa fa-chevron-right' />
            </button>
          )}

          {state.isJpegPreviewDisplayable && props.filePageNb > 1 && (
            <div className='previewcomponent__slider__pagecount'>
              {props.fileCurrentPage}{props.t(' of ')}{props.filePageNb}
            </div>
          )}
        </div>

        <div className='previewcomponent__property'>
          <div className='previewcomponent__property__button' onClick={props.onClickProperty}>
            <div className='previewcomponent__property__button__arrow mt-3'>
              <i className={classnames('fa fa-fw', {'fa-angle-double-right': props.displayProperty, 'fa-angle-double-left': !props.displayProperty})} />
            </div>

            <div className='previewcomponent__property__button__title'>
              {props.t('Properties')}
            </div>

            <div className='previewcomponent__property__button__arrow mb-3'>
              <i className={classnames('fa fa-fw', {'fa-angle-double-right': props.displayProperty, 'fa-angle-double-left': !props.displayProperty})} />
            </div>
          </div>

          <div className='previewcomponent__property__content'>
            <div className='previewcomponent__property__content__detail'>
              <div className='previewcomponent__property__content__detail__item'>
                {props.t('Size')}: {props.fileSize}
              </div>

              <div className='previewcomponent__property__content__detail__item'>
                {props.t('Page number')}: {props.filePageNb}
              </div>

              <div className='previewcomponent__property__content__detail__description'>
                {state.displayFormNewDescription
                  ? (
                    <form className='previewcomponent__property__content__detail__description__editiondesc'>
                      <textarea
                        value={state.newDescription}
                        onChange={this.handleChangeDescription}
                      />

                      <div className='previewcomponent__property__content__detail__description__editiondesc__btn'>
                        <button
                          type='button'
                          className='previewcomponent__property__content__detail__description__editiondesc__btn__cancel btn'
                          onClick={this.handleToggleFormNewDescription}
                        >
                          {props.t('Cancel')}
                        </button>

                        <button
                          type='button'
                          className='previewcomponent__property__content__detail__description__editiondesc__validate btn'
                          onClick={this.handleClickValidateNewDescription}
                        >
                          {props.t('Validate')}
                        </button>
                      </div>
                    </form>
                  )
                  : (
                    <label>
                      {props.t('Description')}: {props.description}
                    </label>
                  )
                }
              </div>

              {props.displayChangeDescriptionBtn && !state.displayFormNewDescription &&
                <button
                  type='button'
                  className='previewcomponent__property__content__detail__btndesc btn outlineTextBtn'
                  onClick={this.handleToggleFormNewDescription}
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: props.color,
                    ':hover': {
                      backgroundColor: props.color
                    }
                  }}
                  disabled={props.disableChangeDescription}
                >
                  {props.t('Change description')}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(PreviewComponent))
