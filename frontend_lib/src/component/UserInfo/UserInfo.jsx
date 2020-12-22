import React from 'react'
import { Avatar } from '../Avatar/Avatar.jsx'
import PropTypes from 'prop-types'

const UserInfo = props => {
  return (
    <div className='userInfo'>
      <Avatar width='40px' publicName={props.publicName} />
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
