import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'

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

  render () {
    const { props, state } = this

    return (
      <div className={classnames('file__contentpage__preview', {'activesidebar': props.displayProperty})}>
        <div className='file__contentpage__preview__dloption'>
          <button
            type='button'
            className='file__contentpage__preview__dloption__icon'
            onClick={props.onClickDownloadRaw}
          >
            <i className='fa fa-download' />
          </button>

          <button
            type='button'
            className='file__contentpage__preview__dloption__icon'
            onClick={props.onClickDownloadPdfPage}
          >
            <i className='fa fa-file-pdf-o' />
          </button>

          <button
            type='button'
            className='file__contentpage__preview__dloption__icon'
            onClick={props.onClickDownloadPdfFull}
          >
            <i className='fa fa-files-o' />
          </button>
        </div>

        <div className='file__contentpage__preview__slider'>
          <div className='file__contentpage__preview__slider__icon'>
            <i className='fa fa-chevron-left' />
          </div>

          <div className='file__contentpage__preview__slider__fileimg'>
            <img src={props.previewFile} className='img-thumbnail mx-auto' />
          </div>

          <div className='file__contentpage__preview__slider__icon'>
            <i className='fa fa-chevron-right' />
          </div>
        </div>

        <div className='file__contentpage__preview__sidebar'>
          <div className='file__contentpage__preview__sidebar__button' onClick={props.onClickProperty}>
            <div className='file__contentpage__preview__sidebar__button__icon'>
              <i className='fa fa-gear' />
            </div>

            <div className='file__contentpage__preview__sidebar__button__title'>
              {props.t('Properties')}
            </div>
          </div>

          <div className='file__contentpage__preview__sidebar__property'>
            <div className='file__contentpage__preview__sidebar__property__detail'>
              <div className='file__contentpage__preview__sidebar__property__detail__size'>
                {props.t('Size')}: nyi
              </div>

              <div className='file__contentpage__preview__sidebar__property__detail__description'>
                {state.displayFormNewDescription
                  ? (
                    <form className='file__contentpage__preview__sidebar__property__detail__description__editiondesc'>
                      <textarea
                        value={state.newDescription}
                        onChange={this.handleChangeDescription}
                      />

                      <div className='file__contentpage__preview__sidebar__property__detail__description__editiondesc__btn'>
                        <button
                          type='button'
                          className='file__contentpage__preview__sidebar__property__detail__description__editiondesc__btn__cancel btn'
                          onClick={this.handleToggleFormNewDescription}
                        >
                          {props.t('Cancel')}
                        </button>

                        <button
                          type='button'
                          className='file__contentpage__preview__sidebar__property__detail__description__editiondesc__validate btn'
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
                className='file__contentpage__preview__sidebar__property__detail__btndesc btn'
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

export default translate()(PreviewComponent)
