import React from 'react'
import { translate } from 'react-i18next'
import {
  IconButton,
  ROLE_LIST,
  BtnSwitch
} from 'tracim_frontend_lib'
import EmailNotificationTypeButton from '../EmailNotificationTypeButton/EmailNotificationTypeButton.jsx'

require('./UserSpacesConfigLine.styl')

class UserSpacesConfigLine extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isSubscribed: false
    }
  }

  setIsSubscribed = (status) => {
    this.setState({ isSubscribed: status })
  }

  render () {
    const { props, state } = this
    const memberRole = ROLE_LIST.find(r => r.slug === props.space.member.role)
    return (
      <tr>
        <td>
          <div className='spaceconfig__table__spacename'>
            {props.space.label}
          </div>
        </td>
        <td>
          <div className='spaceconfig__table__role'>
            <div className='spaceconfig__table__role__icon'>
              <i className={`fa-fw ${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />
            </div>
            <div className='spaceconfig__table__role__text d-none d-sm-flex'>
              {props.t(memberRole.label)}
            </div>
          </div>
        </td>
        {(props.system.config.email_notification_activated &&
          <td>
            <EmailNotificationTypeButton
              currentEmailNotificationType={props.space.member.emailNotificationType}
              onClickChangeEmailNotificationType={props.onChangeEmailNotificationType}
            />
          </td>
        )}
        <td>
          <div className='usersstatus__item__value webNotifSubscription__value'>
            <BtnSwitch
              smallSize
              onChange={() => this.setIsSubscribed(!state.isSubscribed)}
              checked={state.isSubscribed}
              activeLabel={props.t('Enabled')}
              inactiveLabel={props.t('Disabled')}
            />
          </div>
        </td>
        <td data-cy='spaceconfig__table__leave_space_cell'>
          <IconButton
            customClass='spaceconfig__table__leave_space_cell'
            mode='dark'
            intent='secondary'
            disabled={props.onlyManager}
            onClick={(() => props.onLeaveSpace(props.space.id))}
            icon='fas fa-sign-out-alt'
            text={props.admin ? props.t('Remove from space') : props.t('Leave space')}
            title={
              props.onlyManager
                ? (
                  props.admin
                    ? props.t('You cannot remove this member because there are no other space managers.')
                    : props.t('You cannot leave this space because there are no other space managers.')
                )
                : props.admin ? props.t('Remove from space') : props.t('Leave space')
            }
          />
        </td>
      </tr>
    )
  }
}

export default translate()(UserSpacesConfigLine)
