import React from 'react'
import PropTypes from 'prop-types'
import {
  CardPopup,
  PROFILE
 } from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const AdminUserInfoPopup = props => {

  const getNumberActiveGuests = () => {
    return props.userList.filter(user =>
      user.profile?.toLowerCase() === PROFILE.guest.slug
    ).filter(user =>
      user.is_active === true
    ).length
  }

  const getNumberActiveUsers = () => {
    return props.userList.filter(user =>
      user.profile?.toLowerCase() !== PROFILE.guest.slug
    ).filter(user =>
      user.is_active === true
    ).length
  }


  return (
    <CardPopup
      customClass='adminUser___right'
      customColor={props.config.hexcolor}
      faIcon='far fa-id-card'
      label={props.t('View user limitations')}
      onClose={props.onClose}
    >
      <div>
        {props.config.limitation__max_non_guest_users !== -1 && (
          <p>
            {
              props.t('Normal users: {{currentGuests}}/{{maxGuests}} ({{count}} slots remaining)',
                {
                  currentGuests: getNumberActiveUsers(),
                  maxGuests: props.config.limitation__max_non_guest_users,
                  count: props.config.limitation__max_non_guest_users - getNumberActiveUsers()
                }
              )
            }
          </p>
        )}
        {props.config.limitation__max_non_guest_users === -1 && (
          <p>{props.t('No limit for the number of users')}</p>
        )}
        {props.config.limitation__max_guest_users !== -1 && (
          <p>
            {
              props.t('Guest users: {{currentGuests}}/{{maxGuests}} ({{count}} slots remaining)',
                {
                  currentGuests: getNumberActiveGuests(),
                  maxGuests: props.config.limitation__max_guest_users,
                  count: props.config.limitation__max_guest_users - getNumberActiveGuests()
                }
              )
            }
          </p>
        )}
        {props.config.limitation__max_guest_users === -1 && (
          <p>{props.t('No limit for the number of guests')}</p>
        )}

        {
          props.config.limitation__max_guest_user_nb_space !== -1 && (
            <p>
              {props.t(
                'A guest can join up to {{count}} space',
                { count: props.config.limitation__max_guest_user_nb_space })}
            </p>
          )
        }
        {props.config.limitation__max_guest_user_nb_space === -1 && (
          <p>{props.t('No limit to the number spaces a guest user can join')}</p>
        )}
      </div>

    </CardPopup>
  )
}

export default translate()(AdminUserInfoPopup)

AdminUserInfoPopup.propTypes = {
  config: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  userList: PropTypes.array
}

AdminUserInfoPopup.defaultProps = {
  onClose: () => { },
  userList: []
}
