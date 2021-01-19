import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PAGE } from '../../helper.js'
import { translate } from 'react-i18next'

const ProfileNavigation = props => {
  return (
    <Link
      className='profileNavigation'
      to={PAGE.PUBLIC_PROFILE(props.user.userId)}
      title={props.t("{{user}}'s profile", { user: props.user.publicName })}
    >
      {props.children}
    </Link>
  )
}

export default translate()(ProfileNavigation)

ProfileNavigation.propTypes = {
  user: PropTypes.object.isRequired
}
