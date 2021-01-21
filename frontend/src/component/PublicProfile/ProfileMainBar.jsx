import React from 'react'
import { FETCH_CONFIG } from '../../util/helper.js'
import {
  Avatar,
  AVATAR_SIZE,
  Breadcrumbs
} from 'tracim_frontend_lib'
import PropTypes from 'prop-types'

export const ProfileMainBar = props => {
  return (
    <div className='profile__mainBar'>
      <Avatar
        customClass='profile__mainBar__bigAvatar'
        apiUrl={FETCH_CONFIG.apiUrl}
        user={props.displayedUser}
        size={AVATAR_SIZE.BIG}
        style={{ position: 'relative', top: '-15px' }}
      />
      <Avatar
        customClass='profile__mainBar__mediumAvatar'
        apiUrl={FETCH_CONFIG.apiUrl}
        user={props.displayedUser}
        size={AVATAR_SIZE.MEDIUM}
      />
      {props.displayedUser
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
  breadcrumbsList: PropTypes.string,
  displayedUser: PropTypes.object
}

ProfileMainBar.defaultProps = {
  breadcrumbsList: '',
  displayedUser: { }
}
