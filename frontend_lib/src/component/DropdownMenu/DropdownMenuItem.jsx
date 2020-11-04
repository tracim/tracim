import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const DropdownMenuItem = props => {
  return (
    <button
      className={classnames('transparentButton dropdownMenuItem primaryColorBgActive dropdown-item', props.customClass)}
    >
      {props.children}
    </button>
  )
}

export default DropdownMenuItem

DropdownMenuItem.propTypes = {
  customClass: PropTypes.string
}

DropdownMenuItem.defaultProps = {
  customClass: ''
}
