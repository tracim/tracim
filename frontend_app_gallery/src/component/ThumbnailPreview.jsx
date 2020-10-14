import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

class ThumbnailPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      imageLoaded: IMG_LOAD_STATE.LOADING
    }
  }

  handleImageLoad = () => {
    this.setState({
      imageLoaded: IMG_LOAD_STATE.LOADED
    })
  }

  handleImageError = () => {
    this.setState({
      imageLoaded: IMG_LOAD_STATE.ERROR
    })
  }

  componentDidUpdate (prevProps) {
    if (prevProps.previewSrc !== this.props.previewSrc) this.setState({ imageLoaded: IMG_LOAD_STATE.LOADING })
  }

  render () {
    const { props, state } = this

    return (
      <div className='carousel__thumbnail__item__preview__content'>
        {state.imageLoaded === IMG_LOAD_STATE.LOADING && (
          <div className='gallery__loader'>
            <i className='fa fa-spinner fa-spin gallery__loader__icon' />
          </div>
        )}
        {(state.imageLoaded === IMG_LOAD_STATE.ERROR
          ? (
            <i className='fa fa-fw fa-exclamation-triangle carousel__thumbnail__item__preview__error' />
          ) : (
            <img
              src={props.previewSrc}
              className={classnames(`rotate${props.rotationAngle}`, state.imageLoaded ? 'carousel__thumbnail__item__preview__content__image img-thumbnail' : null)}
              onLoad={this.handleImageLoad}
              onError={this.handleImageError}
              alt={props.fileName}
              style={{ visibility: state.imageLoaded === IMG_LOAD_STATE.LOADING ? 'hidden' : 'visible' }}
            />
          )
        )}
      </div>
    )
  }
}

export default ThumbnailPreview

ThumbnailPreview.propTypes = {
  previewSrc: PropTypes.string,
  rotationAngle: PropTypes.number
}

ThumbnailPreview.defaultProps = {
  previewSrc: '',
  rotationAngle: 0
}
