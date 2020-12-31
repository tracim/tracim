import React from 'react'
import { Avatar, AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import PropTypes from 'prop-types'

const UserInfo = props => {
  return (
    <div className='userInfo'>
      <Avatar size={AVATAR_SIZE.SMALL} publicName={props.publicName} />
      <div className='userInfo__name' title={props.publicName}>
        {props.publicName}
        {props.username && (
          <div className='userInfo__username' title={`@${props.username}`}>
            @{props.username}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserInfo

UserInfo.propTypes = {
  publicName: PropTypes.string.isRequired,
  username: PropTypes.string
}

UserInfo.defaultProps = {
  username: ''
}
