import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PAGE } from '../../helper.js'

const ProfileNavigation = props => {
  return (
    <Link
      className='profileNavigation'
      to={PAGE.PUBLIC_PROFILE(props.user.userId)}
    >
      {props.children}
    </Link>
  )
}

export default ProfileNavigation

ProfileNavigation.propTypes = {
  user: PropTypes.object.isRequired
}
