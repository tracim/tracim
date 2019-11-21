import React from 'react'
import classnames from 'classnames'
import { DIRECTION } from '../helper'
import PropTypes from 'prop-types'
import MainPreview from './MainPreview'

const CarouselArrow = (props) => {
  const { onClick } = props
  return (
    <div
      className={classnames(
        'carousel__arrow',
        'carousel__arrow__next',
        props.direction === DIRECTION.RIGHT ? 'carousel__arrow__next' : 'carousel__arrow__prev'
      )}
      onClick={onClick}
    >
      <i className={classnames('fa', props.direction === DIRECTION.RIGHT ? 'fa-chevron-right' : 'fa-chevron-left')} />
    </div>
  )
}

export default CarouselArrow

MainPreview.propTypes = {
  onClick: PropTypes.func,
  direction: PropTypes.string
}
