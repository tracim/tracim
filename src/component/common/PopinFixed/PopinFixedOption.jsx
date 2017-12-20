import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const PopinFixedOption = props => {
  return (
    <div className='wsFileGeneric__option'>
      <div className='wsFileGeneric__option__menu'>
        <div className='wsFileGeneric__option__menu__action'>
          <i className='fa fa-archive' />
        </div>
        <div className='wsFileGeneric__option__menu__action'>
          <i className='fa fa-trash' />
        </div>
      </div>
    </div>
  )
}

export default PopinFixedOption

PopinFixedOption.propTypes = {

}
