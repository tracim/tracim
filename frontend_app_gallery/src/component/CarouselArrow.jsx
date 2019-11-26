import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { DIRECTION } from '../helper'
import PropTypes from 'prop-types'

const CarouselArrow = (props) => {
  return (
    <div
      className={classnames(
        'carousel__arrow',
        'carousel__arrow__next',
        props.direction === DIRECTION.RIGHT ? 'carousel__arrow__next' : 'carousel__arrow__prev'
      )}
      onClick={props.onClick}
      title={props.direction === DIRECTION.RIGHT ? props.t('Next') : props.t('Previous')}
    >
      <i className={classnames('fa', props.direction === DIRECTION.RIGHT ? 'fa-chevron-right' : 'fa-chevron-left')} />
    </div>
  )
}

export default translate()(CarouselArrow)

CarouselArrow.propTypes = {
  onClick: PropTypes.func,
  direction: PropTypes.string.isRequired
}

CarouselArrow.defaultProps = {
  onClick: () => {},
  direction: DIRECTION.RIGHT
}
