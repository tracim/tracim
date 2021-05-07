import React from 'react'
import { translate } from 'react-i18next'
import { getUserProfile, FETCH_CONFIG } from '../../util/helper.js'
import { Avatar, AVATAR_SIZE } from 'tracim_frontend_lib'
import { Popover, PopoverBody } from 'reactstrap'
import { isMobile } from 'react-device-detect'

require('./UserInfo.styl')

export class UserInfo extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverFullNameOpen: false,
      popoverUsernameOpen: false
    }
  }

  handleTogglePopoverFullName = () => {
    this.setState(prevState => ({
      popoverFullNameOpen: !prevState.popoverFullNameOpen
    }))
  }

  handleTogglePopoverUsername = () => {
    this.setState(prevState => ({
      popoverUsernameOpen: !prevState.popoverUsernameOpen
    }))
  }

  render () {
    const { props } = this

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
            <span id='popoverFullName'>
              {props.user.publicName}
            </span>
            <Popover
              placement='right'
              isOpen={this.state.popoverFullNameOpen}
              target='popoverFullName'
              // INFO - CR - 2021-04-29 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
              toggle={this.handleTogglePopoverFullName}// eslint-disable-line react/jsx-handler-names
              trigger={isMobile ? 'focus' : 'hover'}
            >
              <PopoverBody>
                {props.t('Full name')}
              </PopoverBody>
            </Popover>
          </div>

          {props.user.username && (
            <div className='userinfo__username' data-cy='userinfo__username'>
              <span id='popoverUsername'>
                @{props.user.username}
              </span>
              <Popover
                placement='right'
                isOpen={this.state.popoverUsernameOpen}
                target='popoverUsername'
                // INFO - CR - 2021-04-29 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
                toggle={this.handleTogglePopoverUsername}// eslint-disable-line react/jsx-handler-names
                trigger={isMobile ? 'focus' : 'hover'}
              >
                <PopoverBody>
                  {props.t('Username')}
                </PopoverBody>
              </Popover>
            </div>
          )}

          {props.user.email && (
            <div className='userinfo__email d-block mt-3' data-cy='userinfo__email'>
              <i
                className='fas fa-envelope mr-2'
              />
              <a data-cy='userinfo__email__mailto' href={`mailto:${props.user.email}`}>
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
}

export default translate()(UserInfo)
