import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { PAGE } from '../../../helper.js'
import { translate } from 'react-i18next'

const MenuProfil = props => {
  if (!props.user.logged) return null

  return (
    <li className='header__menu__rightside__itemprofil'>
      <div className='profilgroup dropdown'>
        <button className='profilgroup__name btn btn-outline-primary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
          <img className='profilgroup__name__imgprofil' src={props.user.avatar_url} />

          <div className='profilgroup__name__text'>
            {props.user.public_name}
          </div>
        </button>

        <div className='profilgroup__setting dropdown-menu' aria-labelledby='dropdownMenuButton'>
          <Link className='setting__link dropdown-item' to={PAGE.ACCOUNT}>
            <i className='fa fa-fw fa-user-o mr-2' />
            {props.t('My Account')}
          </Link>

          {/* <div className='setting__link dropdown-item'>Mot de passe</div> */}
          <div className='setting__link dropdown-item' onClick={props.onClickLogout}>
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
