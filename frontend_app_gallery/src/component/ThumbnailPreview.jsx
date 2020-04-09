import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

class ThumbnailPreview extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      imageLoaded: false
    }
  }

  onLoad () {
    this.setState({
      imageLoaded: true
    })
  }

  render () {
    const { props, state } = this

    return (
      <div className='carousel__thumbnail__item__preview__content'>
        {!state.imageLoaded && (
          <div className='gallery__loader'>
            <i className='fa fa-spinner fa-spin gallery__loader__icon' />
          </div>
        )}
        <img
          src={props.previewSrc}
          className={classnames(`rotate${props.rotationAngle}`, state.imageLoaded ? 'carousel__thumbnail__item__preview__content__image img-thumbnail' : null)}
          onLoad={this.onLoad.bind(this)}
          alt={props.fileName}
        />
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
