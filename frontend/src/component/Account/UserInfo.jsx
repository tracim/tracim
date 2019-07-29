import React from 'react'
import { withTranslation } from 'react-i18next'
import { getUserProfile } from '../../helper.js'
import { Avatar } from 'tracim_frontend_lib'

require('./UserInfo.styl')

export const UserInfo = props =>
  <div className='userinfo mr-5 ml-5 mb-5' data-cy='userinfo'>
    <div className='userinfo__avatar' data-cy='userinfo__avatar'>
      <Avatar publicName={props.user.public_name} width={'100px'} />
    </div>

    <div className='userinfo__wrapper'>
      <div className='userinfo__name primaryColorFont mb-3' data-cy='userinfo__name'>
        {`${props.user.public_name}`}
      </div>

      <a href={`mailto:${props.user.email}`} className='userinfo__email d-block mb-3' data-cy='userinfo__email'>
        {props.user.email}
      </a>

      <div className='userinfo__profile mb-3' data-cy='userinfo__profile'>
        <i
          className={`fa fa-${getUserProfile(props.user.profile).faIcon} mr-2`}
          style={{ color: getUserProfile(props.user.profile).hexcolor }}
        />
        {props.t(getUserProfile(props.user.profile).label)}
      </div>
    </div>
  </div>

export default withTranslation()(UserInfo)
