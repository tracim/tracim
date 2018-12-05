import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { PAGE } from '../../../helper.js'
import { translate } from 'react-i18next'
import { Avatar } from 'tracim_frontend_lib'

const MenuProfil = props => {
  if (!props.user.logged) return null

  return (
    <li className='header__menu__rightside__itemprofil'>
      <div className='profilgroup dropdown'>
        <button className='profilgroup__name btn outlineTextBtn nohover dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
          <Avatar
            width={'40px'}
            style={{
              display: 'inline-block',
              marginRight: '10px'
            }}
            publicName={props.user.public_name}
          />

          <div className='profilgroup__name__text'>
            {props.user.public_name}
          </div>
        </button>

        <div className='profilgroup__setting dropdown-menu' aria-labelledby='dropdownMenuButton'>
          <Link className='setting__link primaryColorBgLightenHover dropdown-item' to={PAGE.ACCOUNT}>
            <i className='fa fa-fw fa-user-o mr-2' />
            {props.t('My Account')}
          </Link>

          {/* <div className='setting__link dropdown-item'>Mot de passe</div> */}
          <div className='setting__link primaryColorBgLightenHover dropdown-item' onClick={props.onClickLogout}>
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
