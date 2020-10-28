import React from 'react'
import { translate } from 'react-i18next'

import {
  BtnSwitch,
  IconButton,
  ROLE_LIST
} from 'tracim_frontend_lib'

class UserSpacesConfigLine extends React.Component {
  render () {
    const { props } = this
    const { space, member } = props
    const memberRole = ROLE_LIST.find(r => r.slug === member.role)
    return (
      <tr>
        <td>
          <div className='spaceconfig__table__spacename'>
            {space.label}
          </div>
        </td>
        <td>
          <div className='spaceconfig__table__role'>
            <div className='spaceconfig__table__role__icon'>
              <i className={`fa fa-fw fa-${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />
            </div>
            <div className='spaceconfig__table__role__text d-none d-sm-flex'>
              {props.t(memberRole.label)}
            </div>
          </div>
        </td>
        {(props.system.config.email_notification_activated &&
          <td>
            <BtnSwitch
              checked={member.do_notify}
              onChange={() => props.onChangeSubscriptionNotif(space.workspace_id, !member.do_notify)}
            />
          </td>
        )}
        <td data-cy='spaceconfig__table__leave_space_cell'>
          <IconButton
            mode='dark'
            intent='secondary'
            disabled={props.onlyManager}
            onClick={(() => props.onLeaveSpace(space.workspace_id))}
            icon='sign-out'
            text={props.admin ? props.t('Remove from space') : props.t('Leave space')}
            title={
              props.onlyManager
                ? (
                  props.admin
                    ? props.t('You cannot remove this member because there are no other space managers.')
                    : props.t('You cannot leave this space because there are no other space managers.')
                )
                : undefined
            }
          />
        </td>
      </tr>
    )
  }
}

export default translate()(UserSpacesConfigLine)
