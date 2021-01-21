import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  Avatar,
  AVATAR_SIZE,
  Breadcrumbs,
  IconButton
} from 'tracim_frontend_lib'

export const ProfileMainBar = props => {
  const hasUser = Object.keys(props.displayedUser).length !== 0

  return (
    <div className='profile__mainBar'>
      <div className='profile__mainBar__avatar'>
        <Avatar
          customClass='profile__mainBar__avatar__big'
          publicName={hasUser ? props.displayedUser.publicName : ''}
          size={AVATAR_SIZE.BIG}
          style={{ position: 'relative', top: '-15px' }}
        />
        {props.changeAvatarEnabled && (
          <IconButton
            text='' title={props.t('Change avatar')}
            icon='upload'
            onClick={props.handleChangeAvatar}
            customClass='profile__mainBar__avatar__changeBtn'
            intent='link'
          />
        )}
        <Avatar
          customClass='profile__mainBar__avatar__medium'
          publicName={hasUser ? props.displayedUser.publicName : ''}
          size={AVATAR_SIZE.MEDIUM}
        />
      </div>
      {hasUser
        ? (
          <div className='profile__mainBar__info'>
            <div className='profile__mainBar__info__user'>
              {props.displayedUser.publicName}
              {props.displayedUser.username && (
                <>
                  <span className='profile__mainBar__info__user__separator'> - </span>
                  <span className='profile__mainBar__info__user__username'>@{props.displayedUser.username}</span>
                </>
              )}
            </div>
            <Breadcrumbs breadcrumbsList={props.breadcrumbsList} />
          </div>
        )
        : (
          <div>
            <div className='profile__text__loading' />
            <div className='profile__text__loading' />
          </div>
        )}
    </div>
  )
}

ProfileMainBar.propTypes = {
  breadcrumbsList: PropTypes.array,
  displayedUser: PropTypes.object,
  handleChangeAvatar: PropTypes.func.isRequired,
  changeAvatarEnabled: PropTypes.bool
}

ProfileMainBar.defaultProps = {
  breadcrumbsList: [],
  displayedUser: { },
  changeAvatarEnabled: false
}

export default translate()(ProfileMainBar)
