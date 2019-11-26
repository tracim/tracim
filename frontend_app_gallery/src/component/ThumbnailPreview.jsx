import React from 'react'
import PropTypes from 'prop-types'

export const ThumbnailPreview = (props) => (
  <div className={'carousel__thumbnail__item__preview__content__image'}>
    <img
      src={props.previewSrc}
      className={`img-thumbnail rotate${props.rotationAngle}`}
    />
  </div>
)

export default ThumbnailPreview

ThumbnailPreview.propTypes = {
  previewSrc: PropTypes.string,
  rotationAngle: PropTypes.number
}

ThumbnailPreview.defaultProps = {
  previewSrc: '',
  rotationAngle: 0
}
