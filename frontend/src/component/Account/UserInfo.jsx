import React from 'react'

require('./UserInfo.styl')

export const UserInfo = props =>
  <div className='userinfo mr-5 ml-5 mb-5'>
    <div className='userinfo__avatar'>
      <img src={props.user.avatar_url} />
    </div>

    <div className='userinfo__wrapper'>
      <div className='userinfo__name primaryColorFont mb-3'>
        {`${props.user.public_name}`}
      </div>

      <a href={`mailto:${props.user.email}`} className='userinfo__email d-block mb-3'>
        {props.user.email}
      </a>

      <div className='userinfo__profile mb-3'>
        {props.user.profile}
      </div>
    </div>
  </div>

export default UserInfo
