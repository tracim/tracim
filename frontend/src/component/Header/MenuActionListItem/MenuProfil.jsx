import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { PAGE } from '../../../helper.js'
import { translate } from 'react-i18next'
import { Avatar } from 'tracim_frontend_lib'

require('./MenuProfil.styl')

export const MenuProfil = props => {
  if (!props.user.logged) return null

  return (
    <li className='menuprofil'>
      <div className='menuprofil__dropdown dropdown'>
        <button
          className='menuprofil__dropdown__name outlineTextBtn btn nohover dropdown-toggle'
          type='button'
          data-toggle='dropdown'
          data-cy='menuprofil__dropdown__button'
        >
          <Avatar
            width='40px'
            style={{
              display: 'inline-block',
              marginRight: '10px'
            }}
            publicName={props.user.public_name}
          />

          <div className='menuprofil__dropdown__name__text'>
            {props.user.public_name}
          </div>
        </button>

        <div className='menuprofil__dropdown__setting dropdown-menu' aria-labelledby='dropdownMenuButton'>
          <Link
            className='menuprofil__dropdown__setting__link primaryColorBgActive dropdown-item'
            to={PAGE.ACCOUNT}
            data-cy='menuprofil__dropdown__account__link'
          >
            <i className='fa fa-fw fa-user-o mr-2' />
            {props.t('My Account')}
          </Link>

          <div className='menuprofil__dropdown__setting__link primaryColorBgActive dropdown-item' onClick={props.onClickLogout}>
            <i className='fa fa-fw fa-sign-out mr-2' />
            {props.t('Logout')}
          </div>
        </div>
      </div>
    </li>
  )
}
export default translate()(MenuProfil)

MenuProfil.propTypes = {
  user: PropTypes.object.isRequired,
  onClickLogout: PropTypes.func.isRequired
}
