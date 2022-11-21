import React from 'react'
import PropTypes from 'prop-types'
import TextInput from '../Input/TextInput.jsx'

require('./FilterBar.styl')

const FilterBar = (props) => {
  return (
    <div className='filterBar'>
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
  placeholder: PropTypes.string,
  icon: PropTypes.string
}

FilterBar.defaultProps = {
  placeholder: 'Filter this list',
  icon: 'filter'
}

export default FilterBar
