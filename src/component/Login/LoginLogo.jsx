import React from 'react'
import PropTypes from 'prop-types'

const Logo = props => {
  return (
    <div className={props.customClass}>
      <img src={props.logoSrc} />
    </div>
  )
}
export default Logo

Logo.propTypes = {
  logoSrc: PropTypes.string.isRequired,
  customClass: PropTypes.string
}

Logo.defaultProps = {
  customClass: ''
}
