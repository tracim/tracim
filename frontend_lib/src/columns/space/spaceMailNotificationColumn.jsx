import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import BtnSwitch from '../../component/Input/BtnSwitch/BtnSwitch.jsx'

const spaceMailNotificationColumn = (settings, system, onChangeSubscriptionNotif) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <>
        {(system.config.email_notification_activated &&
          <span>{settings.header}</span>
        )}
      </>
    ),
    id: 'mailNotification',
    cell: props => {
      return (
        <>
          {(system.config.email_notification_activated &&
            <BtnSwitch
              checked={props.getValue().member.doNotify}
              onChange={() => onChangeSubscriptionNotif(props.getValue().id, !props.getValue().member.doNotify)}
            />
          )}
        </>
      )
    },
    className: settings.className
  })
}

export default spaceMailNotificationColumn
