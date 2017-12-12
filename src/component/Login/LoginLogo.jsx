import React from 'react'
import PropTypes from 'prop-types'

const Logo = props => {
  return (
    <div className='loginpage__content__logo'>
      <img src={props.logoSrc} />
    </div>
  )
}
export default Logo

Logo.PropTypes = {
  logoSrc: PropTypes.string.isRequired
}
