import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PAGE } from 'tracim_frontend_lib'

require('./Logo.styl')

const Logo = props => {
  return (
    <Link className='tracimLogo' to={props.to}>
      <img className='tracimLogo__img' src={props.logoSrc} />
    </Link>
  )
}
export default Logo

Logo.propTypes = {
  logoSrc: PropTypes.string.isRequired,
  to: PropTypes.string
}

Logo.defaultProps = {
  to: PAGE.LOGIN
}
