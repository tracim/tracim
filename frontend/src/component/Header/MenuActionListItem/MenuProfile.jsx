import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import { FETCH_CONFIG } from '../../../util/helper.js'
import { Avatar, AVATAR_SIZE, IconButton, PAGE } from 'tracim_frontend_lib'
import classnames from 'classnames'

export const MenuProfile = props => {
  if (!props.user.logged) return null

  return (
    <div
      className={classnames('sidebar__item sidebar__title',
        { 'sidebar__item__current primaryColorBorder primaryColorBgOpacity': props.isCurrentItem }
      )}
    >
      <IconButton
        customClass='sidebar__item__foldChildren'
        icon={`fas fa-caret-${props.showUserItems ? 'down' : 'right'}`}
        title={props.showUserItems ? props.t('Hide user menu') : props.t('Show user menu')}
        intent='link'
        mode='light'
        onClick={props.onClickToggleUserItems}
      />
      <Link
        className='sidebar__item'
        to={PAGE.PUBLIC_PROFILE(props.user.userId)}
        data-cy='menuprofile__sidebar'
      >
        <Avatar
          size={AVATAR_SIZE.SMALL}
          user={props.user}
          apiUrl={FETCH_CONFIG.apiUrl}
          key='menuprofile__sidebar__avatar'
        />
        <span>&nbsp;{props.user.publicName}</span>
      </Link>
    </div>
  )
}
export default translate()(MenuProfile)

MenuProfile.propTypes = {
  user: PropTypes.object.isRequired,
  isCurrentItem: PropTypes.bool,
  onClickToggleUserItems: PropTypes.func,
  showUserItems: PropTypes.bool
}

MenuProfile.defaultProps = {
  isCurrentItem: false,
  onClickToggleUserItems: () => { },
  showUserItems: true
}
