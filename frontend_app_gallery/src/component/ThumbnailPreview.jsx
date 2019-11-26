import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export const ThumbnailPreview = (props) => (
  <div className={'thumbnail__item__preview__content'}>
    <div className={classnames('thumbnail__item__preview__content__image')}>
      <img
        src={props.previewSrc}
        className={`img-thumbnail rotate${props.rotationAngle}`}
      />
    </div>
  </div>
)

export default ThumbnailPreview

ThumbnailPreview.propTypes = {
  previewSrc: PropTypes.string,
  rotationAngle: PropTypes.number
}
