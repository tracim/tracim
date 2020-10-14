import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

export class MainPreview extends React.Component {
  constructor (props) {
    super(props)
    this.imgContainer = React.createRef()
    this.img = React.createRef()
    this.state = {
      imageLoaded: IMG_LOAD_STATE.LOADING,
      style: {
        maxWidth: '100%',
        maxHeight: '100%',
        width: '',
        height: ''
      }
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

  computeImageRatioForRotation () {
    if (this.props.rotationAngle % 180) {
      // INFO - RJ - 2020/04/15 - if the image is rotated such as the height "becomes" the width,
      // let us fix its maximum dimensions when the DOM is ready

      window.requestAnimationFrame(() => {
        const imgContainer = this.imgContainer.current
        const img = this.img.current

        const imgContainerStyle = window.getComputedStyle(imgContainer)

        const imgContainerHeight = imgContainer.clientHeight - (
          parseFloat(imgContainerStyle.paddingTop) +
          parseFloat(imgContainerStyle.paddingBottom)
        )

        const imgContainerWidth = imgContainer.clientHeight - (
          parseFloat(imgContainerStyle.paddingLeft) +
          parseFloat(imgContainerStyle.paddingRight)
        )

        let width = Math.min(img.naturalWidth, imgContainerHeight)
        let height = width * img.naturalHeight / img.naturalWidth

        if (height > imgContainer.clientWidth) {
          height = Math.min(img.naturalHeight, imgContainerWidth)
          width = height * img.naturalWidth / img.naturalHeight
        }

        this.setState({
          style: {
            maxWidth: '',
            maxHeight: '',
            width: height > width ? width : '',
            height: width > height ? height : ''
          }
        })
      })
    } else if (this.state.style.maxWidth !== '100%') {
      this.setState({
        style: {
          maxWidth: '100%',
          maxHeight: '100%',
          width: '',
          height: ''
        }
      })
    }
  }

  componentDidMount () {
    this.computeImageRatioForRotation()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.rotationAngle !== this.props.rotationAngle) this.computeImageRatioForRotation()
    if (prevProps.previewSrc !== this.props.previewSrc) this.setState({ imageLoaded: IMG_LOAD_STATE.LOADING })
  }

  render () {
    const { props, state } = this

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          {state.imageLoaded === IMG_LOAD_STATE.LOADING && (
            <div className='gallery__loader'>
              <i className='fa fa-spinner fa-spin gallery__loader__icon' />
            </div>
          )}
          {(state.imageLoaded === IMG_LOAD_STATE.ERROR
            ? (
              <div className='carousel__item__preview__error'>
                <div className='carousel__item__preview__error__message'>
                  <i className='fa fa-fw fa-exclamation-triangle carousel__item__preview__error__icon' />
                  <div>{props.t('No preview available')}</div>
                </div>
              </div>
            ) : (
              <div className='carousel__item__preview__content__image' ref={this.imgContainer}>
                <img
                  src={props.previewSrc}
                  className={classnames(`rotate${props.rotationAngle}`, state.imageLoaded ? 'img-thumbnail' : null)}
                  onClick={props.onClickShowImageRaw}
                  onLoad={this.handleImageLoad}
                  onError={this.handleImageError}
                  style={this.state.style}
                  ref={this.img}
                  alt={props.fileName}
                />
              </div>
            )
          )}
        </span>
      </div>
    )
  }
}

export default translate()(MainPreview)

MainPreview.propTypes = {
  previewSrc: PropTypes.string,
  index: PropTypes.number,
  onClickShowImageRaw: PropTypes.func,
  rotationAngle: PropTypes.number
}

MainPreview.defaultProps = {
  previewSrc: '',
  index: 0,
  onClickShowImageRaw: () => {},
  rotationAngle: 0
}
