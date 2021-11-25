import React from 'react'
import { translate } from 'react-i18next'
import {
  BtnSwitch,
  DropdownMenu,
  IconButton,
  ROLE_LIST,
} from 'tracim_frontend_lib'

export const AdminUserSpacesConfigItem = props => {
  let buttonTitle = ''
  if (props.memberRole) {
    buttonTitle = props.onlyManager
      ? props.t('You cannot remove this member because there are no other space managers.')
      : props.t('Remove from space')
  } else buttonTitle = props.t('Add to space')
  return (
    <tr key={`memberSpaceList_${props.space.workspace_id}`}>
      <td>
        {props.space.workspace_id}
      </td>
      <td className='adminUserSpacesConfig__zones__table__spaceName'>
        {props.space.label}
      </td>
      {(props.memberRole &&
      <td>
        <DropdownMenu
          buttonOpts={<i className={`fas fa-fw fa-${props.memberRole.faIcon}`} style={{ color: props.memberRole.hexcolor }} />}
          buttonLabel={props.t(props.memberRole.label)}
          buttonCustomClass='nohover btndropdown transparentButton'
          isButton
        >
          {ROLE_LIST.map(r =>
            <button
              className='transparentButton'
              onClick={() => props.onClickChangeRole(props.space, r)}
              key={r.id}
            >
              <i className={`fas fa-fw fa-${r.faIcon}`} style={{ color: r.hexcolor }} />
              {props.t(r.label)}
            </button>
          )}
        </DropdownMenu>
      </td>
      )}
      {(props.emailNotificationActivated &&
        <td className='adminUserSpacesConfig__zones__table__notifications'>
          <div>{props.t('Email notif')}</div>
          <BtnSwitch
            checked={props.member.do_notify}
            onChange={() => props.onChangeSubscriptionNotif(props.space.workspace_id, !props.member.do_notify)}
          />
        </td>
      )}
      <td data-cy='spaceconfig__table__leave_space_cell'>
        <IconButton
          disabled={props.memberRole && props.onlyManager}
          icon={`fas fa-sign-${props.memberRole ? 'out' : 'in'}-alt`}
          iconColor={props.memberRole ? 'red' : 'green'}
          intent='secondary'
          onClick={(() => props.onClickButton(props.space))}
          mode='dark'
          title={buttonTitle}
        />
      </td>
    </tr>
  )
}
export default translate()(AdminUserSpacesConfigItem)

AdminUserSpacesConfigItem.propTypes = {
  space: PropTypes.number.isRequired,
  onClickButton: PropTypes.func.isRequired,
  emailNotificationActivated: PropTypes.bool,
  memberRole: PropTypes.object,
  onlyManager: PropTypes.bool,
  onChangeSubscriptionNotif: PropTypes.func,
  member: PropTypes.object,
  onClickChangeRole: PropTypes.func
}

AdminUserSpacesConfigItem.defaultProps = {
  emailNotificationActivated: false,
  onlyManager: false,
  onChangeSubscriptionNotif: () => { },
  member: {
    do_notify: false
  },
  onClickChangeRole: () => { }
}
