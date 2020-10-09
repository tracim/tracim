import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { BtnSwitch, ROLE_LIST } from 'tracim_frontend_lib'

export const Notification = props =>
  <div className='account__userpreference__setting__notification'>
    <div className='notification__sectiontitle subTitle ml-2 ml-sm-0'>
      {props.t('Spaces and notifications')}
    </div>

    <div className='notification__text ml-2 ml-sm-0' />

    <div className='notification__table'>
      <table className='table'>
        <thead>
          <tr>
            <th>{props.t('Space')}</th>
            <th>{props.t('Role')}</th>
            <th>{props.t('Notification')}</th>
          </tr>
        </thead>

        <tbody>
          {(props.workspaceList.length > 0
            ? props.workspaceList.map(ws => {
              if (ws.memberList.length > 0) {
                const mySelf = ws.memberList.find(u => u.id === props.userLoggedId)
                const myRole = ROLE_LIST.find(r => r.slug === mySelf.role)
                return (
                  <tr key={`ws_${ws.id}`}>
                    <td>
                      <div className='notification__table__wksname'>
                        {ws.label}
                      </div>
                    </td>

                    <td>
                      <div className='notification__table__role'>
                        <div className='notification__table__role__icon'>
                          <i className={`fa fa-fw fa-${myRole.faIcon}`} style={{ color: myRole.hexcolor }} />
                        </div>
                        <div className='notification__table__role__text d-none d-sm-flex'>
                          {props.t(myRole.label)}
                        </div>
                      </div>
                    </td>

                    <td>
                      <BtnSwitch
                        checked={mySelf.doNotify}
                        onChange={() => props.onChangeSubscriptionNotif(ws.id, !mySelf.doNotify)}
                      />
                    </td>
                  </tr>
                )
              }
            })
            : (
              <tr>
                <td>{props.t('You are not a member of any space yet')}</td>
                <td />
                <td />
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  </div>

export default translate()(Notification)

Notification.propTypes = {
  workspaceList: PropTypes.arrayOf(PropTypes.object),
  userLoggedId: PropTypes.number,
  onChangeSubscriptionNotif: PropTypes.func
}

Notification.defaultProps = {
  workspaceList: [],
  onChangeSubscriptionNotif: () => { }
}
