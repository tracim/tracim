import React from 'react'
import {
  Avatar,
  AVATAR_SIZE,
  Breadcrumbs
} from 'tracim_frontend_lib'
import PropTypes from 'prop-types'

export const ProfileMainBar = props => {
  const hasUser = Object.keys(props.displayedUser).length !== 0

  return (
    <div className='profile__mainBar'>
      <Avatar
        customClass='profile__mainBar__bigAvatar'
        publicName={hasUser ? props.displayedUser.publicName : ''}
        size={AVATAR_SIZE.BIG}
        style={{ position: 'relative', top: '-15px' }}
      />
      <Avatar
        customClass='profile__mainBar__mediumAvatar'
        publicName={hasUser ? props.displayedUser.publicName : ''}
        size={AVATAR_SIZE.MEDIUM}
      />
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

export default ProfileMainBar

ProfileMainBar.propTypes = {
  breadcrumbsList: PropTypes.array,
  displayedUser: PropTypes.object
}

ProfileMainBar.defaultProps = {
  breadcrumbsList: '',
  displayedUser: { }
}
