import React from 'react'
import PropTypes from 'prop-types'

class MainPreview extends React.Component {
  onLoad ({ target: img }) {
    this.height = img.height
    this.width = img.width
  }

  render () {
    const { props } = this

    let width = this.width
    if (props.rotationAngle === 90 || props.rotationAngle === 270) {
      width = this.height
    }

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          <div className='carousel__item__preview__content__image'>
            <img
              src={props.previewSrc}
              className={`rotate${props.rotationAngle}`}
              onClick={() => props.handleClickShowImageRaw(props.index)}
              onLoad={this.onLoad.bind(this)}
              width={width && this.width > width ? width : null}
            />
          </div>
          <div className='carousel__item__preview__content__bottom'>

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
  index: PropTypes.string,
  handleClickShowImageRaw: PropTypes.func,
  rotationAngle: PropTypes.number
}
