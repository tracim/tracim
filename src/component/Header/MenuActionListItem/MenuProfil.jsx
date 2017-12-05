import React from 'react'
import PropTypes from 'prop-types'

const MenuProfil = props => {
  return props.user.isLoggedin
    ? (
      <li className='header__menu__rightside__itemprofil'>
        <div className='header__menu__rightside__itemprofil__profilgroup dropdown'>
          <button className='profilgroup__name btn btn-secondary dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
            <img className='profilgroup__name__imgprofil' src={props.user.avatar} alt='avatar' />
            <div className='profilgroup__name__text'>
              {props.user.name}
            </div>
          </button>
          <div className='profilgroup__setting dropdown-menu' aria-labelledby='dropdownMenuButton'>
            <div className='setting__link dropdown-item' onClick={props.onClickMyProfil}>Mon compte</div>
            {/* <div className='setting__link dropdown-item'>Mot de passe</div> */}
            <div className='setting__link dropdown-item' onClick={props.onClickLogout}>Se déconnecter</div>
          </div>
        </div>
      </li>
    )
    : ''
}
export default MenuProfil

MenuProfil.PropTypes = {
  user: PropTypes.object.isRequired,
  onClickMyProfil: PropTypes.func.isRequired,
  onClickLogout: PropTypes.func.isRequired
}
