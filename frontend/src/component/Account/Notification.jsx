import React from 'react'
import { withTranslation } from 'react-i18next'
import { BtnSwitch } from 'tracim_frontend_lib'
import { ROLE } from '../../helper.js'

export const Notification = props =>
  <div className='account__userpreference__setting__notification'>
    <div className='notification__sectiontitle subTitle ml-2 ml-sm-0'>
      {props.t('Shared spaces and notifications')}
    </div>

    <div className='notification__text ml-2 ml-sm-0' />

    <div className='notification__table'>
      <table className='table'>
        <thead>
          <tr>
            <th>{props.t('Shared space')}</th>
            <th>{props.t('Role')}</th>
            <th>{props.t('Notification')}</th>
          </tr>
        </thead>

        <tbody>
          {props.workspaceList.length > 0
            ? props.workspaceList.map(ws => {
              const mySelf = ws.memberList.find(u => u.id === props.userLoggedId)
              const myRole = ROLE.find(r => r.slug === mySelf.role)
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
            })
            : (
              <tr>
                <td>{props.t('You are not a member of any shared space yet')}</td>
                <td />
                <td />
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  </div>

export default withTranslation()(Notification)
