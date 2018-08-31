import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import Radium from 'radium'

export class PreviewComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayFormNewDescription: false,
      newDescription: ''
    }
  }

  handleToggleFormNewDescription = () => this.setState(prev => ({displayFormNewDescription: !prev.displayFormNewDescription}))

  handleChangeDescription = e => this.setState({newDescription: e.target.value})

  handleClickValidateNewDescription = () => {
    this.props.onClickValidateNewDescription(this.state.newDescription)
    this.setState({displayFormNewDescription: false})
  }

  render () {
    const { props, state } = this

    console.log('color', props.color)

    return (
      <div className={classnames('file__contentpage__preview', {'openproperty': props.displayProperty})}>
        <div className='file__contentpage__preview__dloption'>
          <button
            type='button'
            className='file__contentpage__preview__dloption__icon btn iconBtn'
            onClick={props.onClickDownloadRaw}
            style={{':hover': {color: props.color}}}
            key={'file_btn_dl_raw'}
          >
            <i className='fa fa-download' />
          </button>

          <button
            type='button'
            className='file__contentpage__preview__dloption__icon btn iconBtn'
            onClick={props.onClickDownloadPdfPage}
            style={{':hover': {color: props.color}}}
            key={'file_btn_dl_pdfpage'}
          >
            <i className='fa fa-file-pdf-o' />
          </button>

          <button
            type='button'
            className='file__contentpage__preview__dloption__icon btn iconBtn'
            onClick={props.onClickDownloadPdfFull}
            style={{':hover': {color: props.color}}}
            key={'file_btn_dl_pdfall'}
          >
            <i className='fa fa-files-o' />
          </button>
        </div>

        <div className='file__contentpage__preview__slider'>
          <button
            type='button'
            className='file__contentpage__preview__slider__icon btn iconBtn'
            onClick={props.onClickPreviousPage}
            style={{':hover': {color: props.color}}}
            key={'file_btn_previouspage'}
          >
            <i className='fa fa-chevron-left' />
          </button>

          <div className='file__contentpage__preview__slider__fileimg'>
            <img src={props.previewFile} className='img-thumbnail mx-auto' />
          </div>

          <button
            type='button'
            className='file__contentpage__preview__slider__icon btn iconBtn'
            onClick={props.onClickNextPage}
            style={{':hover': {color: props.color}}}
            key={'file_btn_nextpage'}
          >
            <i className='fa fa-chevron-right' />
          </button>
        </div>

        <div className='file__contentpage__preview__property'>
          <div className='file__contentpage__preview__property__button' onClick={props.onClickProperty}>
            <div className='file__contentpage__preview__property__button__icon'>
              <i className='fa fa-gear' />
            </div>

            <div className='file__contentpage__preview__property__button__title'>
              {props.t('Properties')}
            </div>
          </div>

          <div className='file__contentpage__preview__property__content'>
            <div className='file__contentpage__preview__property__content__detail'>
              <div className='file__contentpage__preview__property__content__detail__size'>
                {props.t('Size')}: nyi
              </div>

              <div className='file__contentpage__preview__property__content__detail__description'>
                {state.displayFormNewDescription
                  ? (
                    <form className='file__contentpage__preview__property__content__detail__description__editiondesc'>
                      <textarea
                        value={state.newDescription}
                        onChange={this.handleChangeDescription}
                      />

                      <div className='file__contentpage__preview__property__content__detail__description__editiondesc__btn'>
                        <button
                          type='button'
                          className='file__contentpage__preview__property__content__detail__description__editiondesc__btn__cancel btn'
                          onClick={this.handleToggleFormNewDescription}
                        >
                          {props.t('Cancel')}
                        </button>

                        <button
                          type='button'
                          className='file__contentpage__preview__property__content__detail__description__editiondesc__validate btn'
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
                className='file__contentpage__preview__property__content__detail__btndesc btn outlineTextBtn'
                onClick={this.handleToggleFormNewDescription}
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
