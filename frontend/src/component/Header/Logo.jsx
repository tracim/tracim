import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PAGE } from 'tracim_frontend_lib'

const Logo = props => {
  return (
    <Link className='header__logo navbar-brand' to={props.to}>
      <img className='header__logo__img' src={props.logoSrc} />
    </Link>
  )
}
export default Logo

Logo.propTypes = {
  logoSrc: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired
}

Logo.defaultProps = {
  logoSrc: '',
  to: PAGE.LOGIN
}
