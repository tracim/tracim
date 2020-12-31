import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const DropdownMenuItem = props => {
  return (
    <span
      className={classnames('dropdownMenuItem primaryColorBgActive dropdown-item', props.customClass)}
    >
      {props.children}
    </span>
  )
}

export default DropdownMenuItem

DropdownMenuItem.propTypes = {
  customClass: PropTypes.string
}

DropdownMenuItem.defaultProps = {
  customClass: ''
}
