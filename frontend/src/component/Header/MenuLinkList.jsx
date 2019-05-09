import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

// INFO - CH - 2019-04-17 - Component deprecated because unused

const MenuLinkList = props => {
  return (
    <ul className='header__menu__list text-center navbar-nav mr-auto'>
      <li className='list__item nav-item'>
        <a className='list__item__link' href='' onClick={props.onClickFeature}>
          {props.t('Feature')}
        </a>
      </li>
      <li className='list__item nav-item'>
        <a className='list__item__link' href='' onClick={props.onClickExplore}>
          {props.t('Explore')}
        </a>
      </li>
      <li className='list__item nav-item'>
        <a className='list__item__link' href='' onClick={props.onClickAbout}>
          {props.t('About')}
        </a>
      </li>
    </ul>
  )
}
export default translate()(MenuLinkList)

MenuLinkList.propTypes = {
  onClickFeature: PropTypes.func.isRequired,
  onClickExplore: PropTypes.func.isRequired,
  onClickAbout: PropTypes.func.isRequired
}
