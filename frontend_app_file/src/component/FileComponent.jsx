import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'

export class FileComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayFormNewDescription: false,
      newDescription: props.description
    }
  }

  handleShowFormNewDescription = () => this.setState({displayFormNewDescription: true})

  render () {
    const { props, state } = this

    return (
      <div className={classnames('file__contentpage__statewrapper', {'displayState': props.isArchived || props.isDeleted})}>
        {props.isArchived &&
          <div className='file__contentpage__preview__state'>
            <div className='file__contentpage__preview__state__msg'>
              <i className='fa fa-fw fa-archive' />
              {props.t('This content is archived.')}
            </div>

            <button className='file__contentpage__preview__state__btnrestore btn' onClick={props.onClickRestoreArchived}>
              <i className='fa fa-fw fa-archive' />
              {props.t('Restore')}
            </button>
          </div>
        }

        {props.isDeleted &&
          <div className='file__contentpage__preview__state'>
            <div className='file__contentpage__preview__state__msg'>
              <i className='fa fa-fw fa-trash' />
              {props.t('This content is deleted.')}
            </div>

            <button className='file__contentpage__preview__state__btnrestore btn' onClick={props.onClickRestoreDeleted}>
              <i className='fa fa-fw fa-trash' />
              {props.t('Restore')}
            </button>
          </div>
        }

        <div className={classnames('file__contentpage__preview', {'activesidebar': props.displayProperty})}>
          <div className='file__contentpage__preview__dloption'>
            <div className='file__contentpage__preview__dloption__icon'>
              <i className='fa fa-download' />
            </div>

            <div className='file__contentpage__preview__dloption__icon'>
              <i className='fa fa-file-pdf-o' />
            </div>

            <div className='file__contentpage__preview__dloption__icon'>
              <i className='fa fa-files-o' />
            </div>
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
                        <textarea value={state.newDescription} />
                        <input type='submit' className='file__contentpage__preview__sidebar__property__detail__description__editiondesc__validate form-control' />
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
                    onClick={this.handleShowFormNewDescription}
                  >
                    {props.t('Change description')}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(FileComponent)
