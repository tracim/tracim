import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { FETCH_CONFIG } from '../../../util/helper.js'
import { Avatar, AVATAR_SIZE, PAGE } from 'tracim_frontend_lib'
import classnames from 'classnames'

export const MenuProfil = props => {
  if (!props.user.logged) return null

  return (
    <Link
      to={PAGE.PUBLIC_PROFILE(props.user.userId)}
      data-cy='menuprofil__dropdown__profile__link'
      className={classnames('sidebar__item',
        { 'sidebar__item__current primaryColorBorder': props.isCurrentItem }
      )}
    >
      <Avatar
        size={AVATAR_SIZE.SMALL}
        user={props.user}
        apiUrl={FETCH_CONFIG.apiUrl}
        key='menuprofil__dropdown__avatar'
      />&nbsp;
      {props.user.publicName}
    </Link>
  )
}
export default translate()(MenuProfil)

MenuProfil.propTypes = {
  user: PropTypes.object.isRequired,
  onClickLogout: PropTypes.func.isRequired
}
