import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export class MainPreview extends React.Component {
  constructor (props) {
    super(props)
    this.imgContainer = React.createRef()
    this.img = React.createRef()
    this.state = {
      imageLoaded: false,
      style: {
        maxWidth: '100%',
        maxHeight: '100%',
        width: '',
        height: ''
      }
    }
  }

  onLoad ({ target: img }) {
    this.setState({
      imageLoaded: true
    })
  }

  fixImageSize () {
    if (this.props.rotationAngle % 180) {
      // if the image is rotated such as the height "becomes" the width,
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
            width: width,
            height: height
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
    this.fixImageSize()
  }

  componentDidUpdate () {
    this.fixImageSize()
  }

  render () {
    const { props, state } = this

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          {!state.imageLoaded && (
            <div className='gallery__loader'>
              <i className='fa fa-spinner fa-spin gallery__loader__icon' />
            </div>
          )}
          <div className='carousel__item__preview__content__image' ref={this.imgContainer}>
            <img
              src={props.previewSrc}
              className={classnames(`rotate${props.rotationAngle}`, state.imageLoaded ? 'img-thumbnail' : null)}
              onClick={props.handleClickShowImageRaw}
              onLoad={this.onLoad.bind(this)}
              alt={props.fileName}
              style={this.state.style}
              ref={this.img}
            />
          </div>
        </span>
      </div>
    )
  }
}

export default MainPreview

MainPreview.propTypes = {
  loggedUser: PropTypes.object,
  previewSrc: PropTypes.string,
  index: PropTypes.number,
  handleClickShowImageRaw: PropTypes.func,
  rotationAngle: PropTypes.number
}

MainPreview.defaultProps = {
  loggedUser: {},
  previewSrc: '',
  index: 0,
  handleClickShowImageRaw: () => {},
  rotationAngle: 0
}
