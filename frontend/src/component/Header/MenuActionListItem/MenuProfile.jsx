import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { FETCH_CONFIG } from '../../../util/helper.js'
import { Avatar, AVATAR_SIZE, IconButton, PAGE } from 'tracim_frontend_lib'
import classnames from 'classnames'

export const MenuProfile = props => {
  if (!props.user.logged) return null

  return (
    <div
      className={classnames('sidebar__item',
        { 'sidebar__item__current primaryColorBorder': props.isCurrentItem }
      )}
    >
      <IconButton
        customClass='sidebar__item__foldChildren'
        icon={`fas fa-caret-${props.showUserItems ? 'down' : 'right'}`}
        title={props.showUserItems ? props.t('Hide user items') : props.t('Show user items')}
        intent='link'
        mode='light'
        onClick={props.onClickToggleUserItems}
      />
      <Link
        className='sidebar__item'
        to={PAGE.PUBLIC_PROFILE(props.user.userId)}
        data-cy='menuprofile__dropdown__profile__link'
      >
        <Avatar
          size={AVATAR_SIZE.SMALL}
          user={props.user}
          apiUrl={FETCH_CONFIG.apiUrl}
          key='menuprofile__dropdown__avatar'
        />
        <span>&nbsp;{props.user.publicName}</span>
      </Link>
    </div>
  )
}
export default translate()(MenuProfile)

MenuProfile.propTypes = {
  user: PropTypes.object.isRequired,
  onClickLogout: PropTypes.func.isRequired
}
