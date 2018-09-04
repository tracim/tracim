import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'

require('./Previewcomponent.styl')

export class PreviewComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayFormNewDescription: false,
      newDescription: '',
      displayLightbox: false
    }
  }

  handleToggleFormNewDescription = () => this.setState(prev => ({displayFormNewDescription: !prev.displayFormNewDescription}))

  handleChangeDescription = e => this.setState({newDescription: e.target.value})

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({displayFormNewDescription: false})
  }

  handleClickShowImageRaw = async () => {
    this.setState({displayLightbox: true})
    this.props.onClickDisplayFull()
  }

  render () {
    const { props, state } = this

    return (
      <div className={classnames('previewcomponent', {'closedproperty': !props.displayProperty})}>
        <div className='previewcomponent__dloption'>
          <button
            type='button'
            className='previewcomponent__dloption__icon btn iconBtn'
            onClick={props.onClickDownloadRaw}
            style={{':hover': {color: props.color}}}
            key={'file_btn_dl_raw'}
          >
            <i className='fa fa-download' />
          </button>

          <button
            type='button'
            className='previewcomponent__dloption__icon btn iconBtn'
            onClick={props.onClickDownloadPdfPage}
            style={{':hover': {color: props.color}}}
            key={'file_btn_dl_pdfpage'}
          >
            <i className='fa fa-file-pdf-o' />
          </button>

          <button
            type='button'
            className='previewcomponent__dloption__icon btn iconBtn'
            onClick={props.onClickDownloadPdfFull}
            style={{':hover': {color: props.color}}}
            key={'file_btn_dl_pdfall'}
          >
            <i className='fa fa-files-o' />
          </button>
        </div>

        <div className='previewcomponent__slider'>
          <button
            type='button'
            className='previewcomponent__slider__icon btn iconBtn'
            onClick={props.onClickPreviousPage}
            style={{':hover': {color: props.color}}}
            key={'file_btn_previouspage'}
          >
            <i className='fa fa-chevron-left' />
          </button>

          <div
            className='previewcomponent__slider__fileimg'
            onClick={this.handleClickShowImageRaw}
          >
            <img src={props.previewFile} className='img-thumbnail mx-auto' />

            {state.displayLightbox && props.contentFull !== null && props.contentFull !== undefined &&
              <Lightbox
                mainSrc={props.contentFull}
                onCloseRequest={() => this.setState({displayLightbox: false})}
              />
            }
          </div>

          <button
            type='button'
            className='previewcomponent__slider__icon btn iconBtn'
            onClick={props.onClickNextPage}
            style={{':hover': {color: props.color}}}
            key={'file_btn_nextpage'}
          >
            <i className='fa fa-chevron-right' />
          </button>
        </div>

        <div className='previewcomponent__property'>
          <div className='previewcomponent__property__button' onClick={props.onClickProperty}>
            <div className='previewcomponent__property__button__icon'>
              <i className='fa fa-gear' />
            </div>

            <div className='previewcomponent__property__button__title'>
              {props.t('Properties')}
            </div>
          </div>

          <div className='previewcomponent__property__content'>
            <div className='previewcomponent__property__content__detail'>
              <div className='previewcomponent__property__content__detail__size'>
                {props.t('Size')}: nyi
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

              {!state.displayFormNewDescription &&
              <button
                type='button'
                className='previewcomponent__property__content__detail__btndesc btn outlineTextBtn'
                onClick={this.handleToggleFormNewDescription}
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: props.color,
                  ':hover': {
                    backgroundColor: props.color,
                  }
                }}
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
