import React from 'react'
import PropTypes from 'prop-types'

class MainPreview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      height: 0,
      width: 0
    }
  }

  onLoad ({ target: img }) {
    this.setState({
      height: img.height,
      width: img.width
    })
  }

  render () {
    const { props } = this

    let width = this.state.width
    if (props.rotationAngle === 90 || props.rotationAngle === 270) {
      width = this.state.height
    }

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          <div className='carousel__item__preview__content__image'>
            <img
              src={props.previewSrc}
              className={`img-thumbnail rotate${props.rotationAngle}`}
              onClick={props.handleClickShowImageRaw}
              onLoad={this.onLoad.bind(this)}
              width={width && this.state.width > width ? width : null}
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
