import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { Avatar, AVATAR_SIZE } from '../../component/Avatar/Avatar.jsx'
import ProfileNavigation from '../../component/ProfileNavigation/ProfileNavigation.jsx'

// TODO set in nested object
const userSummaryColumn = (roleList, apiUrl) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => '',
    id: 'summary',
    cell: props => {
      return (
        <div className='memberlist__list'>
          <div className='memberlist__list__item'>
            <div className='memberlist__list__item__avatar'>
              <Avatar
                size={AVATAR_SIZE.SMALL}
                user={props.getValue()}
                apiUrl={apiUrl}
              />
            </div>
            <div className='memberlist__list__item__info'>
              <div className='memberlist__list__item__info__firstColumn'>
                <ProfileNavigation
                  user={{
                    userId: props.getValue().id,
                    publicName: props.getValue().publicName
                  }}
                >
                  <span
                    className='memberlist__list__item__info__firstColumn__name'
                    title={props.getValue().publicName}
                  >
                    {props.getValue().publicName}
                  </span>
                </ProfileNavigation>

                {props.getValue().username && (
                  <div
                    className='memberlist__list__item__info__firstColumn__username'
                    title={`@${props.getValue().username}`}
                  >
                    @{props.getValue().username}
                  </div>
                )}
              </div>

              <div className='memberlist__list__item__info__role'>
                - {props.translate(roleList.find(r => r.slug === props.getValue().role).label)}
              </div>
            </div>
          </div>
        </div>
      )
    },
    className: 'TracimTable__styles__flex__1'
  })
}

export default userSummaryColumn
