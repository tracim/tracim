import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

class MainPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      height: 0,
      width: 0,
      imageLoaded: false
    }
  }

  onLoad ({ target: img }) {
    this.setState({
      height: img.height,
      width: img.width,
      imageLoaded: true
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
          {!state.imageLoaded && (
            <div className='gallery__loader'>
              <i className='fa fa-spinner fa-spin gallery__loader__icon' />
            </div>
          )}
          <div className='carousel__item__preview__content__image'>
            <img
              src={props.previewSrc}
              className={classnames(`rotate${props.rotationAngle}`, state.imageLoaded ? 'img-thumbnail' : null)}
              onClick={props.handleClickShowImageRaw}
              onLoad={this.onLoad.bind(this)}
              width={width && state.width > width ? width : null}
              alt={props.fileName}
            />
          </div>
        </span>
      </div>
    )
  }
}

export default MainPreview

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
