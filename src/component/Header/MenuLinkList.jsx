import React from 'react'
import PropTypes from 'prop-types'

const MenuLinkList = props => {
  return (
    <ul className='header__menu__list text-center navbar-nav mr-auto'>
      <li className='list__item nav-item'>
        <a className='list__item__link' href='' onClick={props.onClickFeature}>Fonctionnalité</a>
      </li>
      <li className='list__item nav-item'>
        <a className='list__item__link' href='' onClick={props.onClickExplore}>Explorer</a>
      </li>
      <li className='list__item nav-item'>
        <a className='list__item__link' href='' onClick={props.onClickAbout}>A Propos</a>
      </li>
    </ul>
  )
}
export default MenuLinkList

MenuLinkList.PropTypes = {
  onClickFeature: PropTypes.func.isRequired,
  onClickExplore: PropTypes.func.isRequired,
  onClickAbout: PropTypes.func.isRequired
}
