import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const CardHeader = props => {
  return (
    <div
      className={classnames('card-header', props.customClass)}
      style={props.displayHeader ? undefined : { display: 'none' }}
    >
      {props.children}
    </div>
  )
}

export default CardHeader

CardHeader.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string
  ]),
  displayHeader: PropTypes.bool,
  customClass: PropTypes.string
}

CardHeader.defaultProps = {
  customClass: '',
  displayHeader: true
}
