import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const NoHoverListItem = props => {
  return (
    <div>
      {props.children}
    </div>
  )
}

export default NoHoverListItem

NoHoverListItem.propTypes = {
  customClass: PropTypes.string,
  label: PropTypes.string,
  isLast: PropTypes.bool,
  read: PropTypes.bool,
  id: PropTypes.number
}

NoHoverListItem.defaultProps = {
  label: '',
  customClass: '',
  isLast: false,
  read: false,
  id: 0
}
