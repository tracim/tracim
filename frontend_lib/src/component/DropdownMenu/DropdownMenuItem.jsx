import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const DropdownMenuItem = props => {
  return (
    <div
      key={props.key}
      className={classnames('dropdownMenuItem primaryColorBgActive dropdown-item', props.customClass)}
    >
      {props.children}
    </div>
  )
}

export default DropdownMenuItem

DropdownMenuItem.propTypes = {
  key: PropTypes.string.isRequired,
  customClass: PropTypes.string
}

DropdownMenuItem.defaultProps = {
  customClass: ''
}
