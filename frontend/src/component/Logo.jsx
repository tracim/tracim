import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PAGE } from 'tracim_frontend_lib'

require('./Logo.styl')

const TRACIM_LOGO_PATH = '/assets/branding/images/tracim-logo.png'
const Logo = props => {
  return (
    <Link className='tracimLogo' to={props.to}>
      <img className='tracimLogo__img' src={TRACIM_LOGO_PATH} />
    </Link>
  )
}
export default Logo

Logo.propTypes = {
  to: PropTypes.string
}

Logo.defaultProps = {
  to: PAGE.LOGIN
}
