import React from 'react'
import PropTypes from 'prop-types'
import TextInput from '../Input/TextInput.jsx'

require('./FilterBar.styl')

const FilterBar = (props) => {
  return (
    <div className={`filterBar ${props.customClass}`}>
      <TextInput
        customClass='form-control'
        {...props}
      />
    </div>
  )
}

FilterBar.propsType = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  placeholder: PropTypes.string,
  icon: PropTypes.string
}

FilterBar.defaultProps = {
  customClass: '',
  placeholder: 'Filter this list',
  icon: 'filter'
}

export default FilterBar
