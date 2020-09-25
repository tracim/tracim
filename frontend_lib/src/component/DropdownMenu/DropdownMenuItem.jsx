import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const DropdownMenuItem = props => {
  return (
    <div
      className={classnames('dropdownMenuItem primaryColorBgActive dropdown-item', props.customClass)}
    >
      {props.children}
    </div>
  )
}

export default DropdownMenuItem

DropdownMenuItem.propTypes = {
  label: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  dataCy: PropTypes.string,
  icon: PropTypes.string,
  image: PropTypes.string,
  onClickItem: PropTypes.func,
  url: PropTypes.string
}

DropdownMenuItem.defaultProps = {
  customClass: '',
  dataCy: '',
  icon: '',
  image: '',
  onClickItem: () => { },
  url: ''
}
