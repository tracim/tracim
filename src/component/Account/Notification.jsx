import React from 'react'
import { translate } from 'react-i18next'
import { BtnSwitch } from 'tracim_lib'
import { ROLE } from '../../helper.js'

export const Notification = props => {
  const getRole = role => ROLE.find(r => r.name === role)

  return (
    <div className='account__userpreference__setting__notification'>
      <div className='notification__sectiontitle subTitle ml-2 ml-sm-0'>
        Espace de Travail et Notification
      </div>

      <div className='notification__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='notification__table'>
        <table className='table'>
          <thead>
            <tr>
              <th>Espace de travail</th>
              <th>Role</th>
              <th>Notification</th>
            </tr>
          </thead>
          <tbody>

            { props.workspaceList.map(ws =>
              <tr key={ws.id}>
                <td>
                  <div className='notification__table__wksname'>
                    {ws.title}
                  </div>
                </td>
                <td>
                  <div className='notification__table__role'>
                    <div className='notification__table__role__icon'>
                      <i className={`fa ${getRole(ws.role).icon}`} />
                    </div>
                    <div className='notification__table__role__text d-none d-sm-flex'>
                      {props.t(getRole(ws.role).translationKey)}
                    </div>
                  </div>
                </td>
                <td>
                  <BtnSwitch checked={ws.notif} onChange={() => props.onChangeSubscriptionNotif(ws.id, !ws.notif)} />
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  )
}

export default translate()(Notification)
