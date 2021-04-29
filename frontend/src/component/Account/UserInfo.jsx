import React, { useState } from 'react'
import { translate } from 'react-i18next'
import { getUserProfile, FETCH_CONFIG } from '../../util/helper.js'
import { Avatar, AVATAR_SIZE } from 'tracim_frontend_lib'
import { Tooltip } from 'reactstrap'

require('./UserInfo.styl')

export const UserInfo = props => {
  const [tooltipOpenUsername, setTooltipOpenUsername] = useState(false)
  const [tooltipOpenPublicName, setTooltipOpenPublicName] = useState(false)
  const toggleTooltipPublicName = () => setTooltipOpenPublicName(!tooltipOpenPublicName)
  const toggleTooltipUserName = () => setTooltipOpenUsername(!tooltipOpenUsername)

  return (
    <div className='userinfo mr-5 ml-5 mb-5' data-cy='userinfo'>
      <div className='userinfo__avatar' data-cy='userinfo__avatar'>
        <Avatar
          size={AVATAR_SIZE.BIG}
          user={props.user}
          apiUrl={FETCH_CONFIG.apiUrl}
        />
      </div>

      <div className='userinfo__wrapper'>
        <div div className='userinfo__name primaryColorFont' data-cy='userinfo__name'>
          <span href='#' id='TooltipPublicName'>{`${props.user.publicName}`}
          </span>
          <Tooltip
            placement='right'
            isOpen={tooltipOpenPublicName}
            target='TooltipPublicName'
            toggle={toggleTooltipPublicName}
          >
            {props.t('Public Name')}
          </Tooltip>
        </div>

        {props.user.username && (
          <div className='userinfo__username' data-cy='userinfo__username'>
            <span href='#' id='TooltipUsername'>{`@${props.user.username}`}
            </span>
            <Tooltip
              placement='right'
              isOpen={tooltipOpenUsername}
              target='TooltipUsername'
              toggle={toggleTooltipUserName}
            >
              {props.t('Username')}
            </Tooltip>
          </div>
        )}

        {props.user.email && (
          <div className='userinfo__email d-block mt-3' data-cy='userinfo__email'>
            <i
              className='fas fa-envelope mr-2'
            />
            <a href={`mailto:${props.user.email}`}>
              {props.user.email}
            </a>
          </div>
        )}

        <div className='userinfo__profile mt-3 mb-3' data-cy='userinfo__profile'>
          <i
            className={`${getUserProfile(props.user.profile).faIcon} mr-2`}
            style={{ color: getUserProfile(props.user.profile).hexcolor }}
          />
          {props.t(getUserProfile(props.user.profile).label)}
        </div>
      </div>
    </div>
  )
}
export default translate()(UserInfo)
