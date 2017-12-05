import React from 'react'
import PropTypes from 'prop-types'

const Logo = props => {
  return (
    <a className='header__logo navbar-brand' onClick={props.onClickImg}>
      <img className='header__logo__img' src={props.logoSrc} />
    </a>
  )
}
export default Logo

Logo.PropTypes = {
  logoSrc: PropTypes.string.isRequired,
  onClickImg: PropTypes.func.isRequired
}
