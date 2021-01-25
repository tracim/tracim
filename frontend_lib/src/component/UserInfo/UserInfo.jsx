import React from 'react'
import Avatar from '../Avatar/Avatar.jsx'
import { AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import PropTypes from 'prop-types'

const UserInfo = props => {
  const publicName = props.user.publicName || props.user.public_name
  return (
    <div className='userInfo'>
      <Avatar
        size={AVATAR_SIZE.SMALL}
        apiUrl={props.apiUrl}
        user={props.user}
      />
      <div className='userInfo__name' title={publicName}>
        {publicName}
        {props.user.username && (
          <div className='userInfo__username' title={`@${props.user.username}`}>
            @{props.user.username}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserInfo

UserInfo.propTypes = {
  user: PropTypes.object.isRequired,
  apiUrl: PropTypes.string.isRequired
}
