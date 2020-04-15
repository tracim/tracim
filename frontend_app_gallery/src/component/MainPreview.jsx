import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

export class MainPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      height: 0,
      width: 0,
      imageLoaded: IMG_LOAD_STATE.LOADING
    }
  }

  onImageLoad = ({ target: img }) => {
    this.setState({
      height: img.height,
      width: img.width,
      imageLoaded: IMG_LOAD_STATE.LOADED
    })
  }

  onImageError = () => {
    this.setState({
      imageLoaded: IMG_LOAD_STATE.ERROR
    })
  }

  render () {
    const { props, state } = this

    let width = state.width
    if (props.rotationAngle === 90 || props.rotationAngle === 270) {
      width = state.height
    }

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          {state.imageLoaded === IMG_LOAD_STATE.LOADING && (
            <div className='gallery__loader'>
              <i className='fa fa-spinner fa-spin gallery__loader__icon' />
            </div>
          )}
          {state.imageLoaded === IMG_LOAD_STATE.ERROR
            ? (
              <div className='carousel__item__preview__error'>
                <div className='carousel__item__preview__error__message'>
                  <i className='fa fa-fw fa-exclamation-triangle carousel__item__preview__error__icon' />
                  <div>{props.t('No preview available')}</div>
                </div>
              </div>
            ) : (
              <div className='carousel__item__preview__content__image'>
                <img
                  src={props.previewSrc}
                  className={classnames(`rotate${props.rotationAngle}`, state.imageLoaded ? 'img-thumbnail' : null)}
                  onClick={props.handleClickShowImageRaw}
                  onLoad={this.onImageLoad}
                  onError={this.onImageError}
                  width={width && state.width > width ? width : null}
                  alt={props.fileName}
                />
              </div>
            )
          }
        </span>
      </div>
    )
  }
}

export default translate()(MainPreview)

MainPreview.propTypes = {
  previewSrc: PropTypes.string,
  index: PropTypes.number,
  handleClickShowImageRaw: PropTypes.func,
  rotationAngle: PropTypes.number
}

MainPreview.defaultProps = {
  previewSrc: '',
  index: 0,
  handleClickShowImageRaw: () => {},
  rotationAngle: 0
}
