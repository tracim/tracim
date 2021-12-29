import React from 'react'
import { translate } from 'react-i18next'
import { getUserProfile, FETCH_CONFIG } from '../../util/helper.js'
import {
  Avatar,
  AVATAR_SIZE,
  Popover
} from 'tracim_frontend_lib'

require('./UserInfo.styl')

export const UserInfo = (props) => {
  return (
    <div className='userinfo' data-cy='userinfo'>
      <div className='userinfo__avatar' data-cy='userinfo__avatar'>
        <Avatar
          size={AVATAR_SIZE.BIG}
          user={props.user}
          apiUrl={FETCH_CONFIG.apiUrl}
        />
      </div>

      <div className='userinfo__wrapper'>
        <div className='userinfo__name primaryColorFont' data-cy='userinfo__name'>
          <span id='popoverFullName'>
            {props.user.publicName}
          </span>
          <Popover
            placement='right'
            targetId='popoverFullName'
            popoverBody={props.t('Full name')}
          />
        </div>

        {props.user.username && (
          <div className='userinfo__username' data-cy='userinfo__username'>
            <span id='popoverUsername'>
              {`@${props.user.username}`}
            </span>
            <Popover
              placement='right'
              targetId='popoverUsername'
              popoverBody={props.t('Username')}
            />
          </div>
        )}

        {props.user.email && (
          <div className='userinfo__email' data-cy='userinfo__email'>
            <i
              className='far fa-fw fa-envelope'
            />
            <a href={`mailto:${props.user.email}`} data-cy='userinfo__email__mailto'>
              {props.user.email}
            </a>
          </div>
        )}

        <div className='userinfo__profile' data-cy='userinfo__profile'>
          <i
            className={`fa-fw ${getUserProfile(props.user.profile).faIcon}`}
            style={{ color: getUserProfile(props.user.profile).hexcolor }}
          />
          {props.t(getUserProfile(props.user.profile).label)}
        </div>
      </div>
    </div>
  )
}

export default translate()(UserInfo)
