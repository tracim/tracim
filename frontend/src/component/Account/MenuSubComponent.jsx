import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'

require('./MenuSubComponent.styl')

export const MenuSubComponent = props => {
  return (
    <nav className='menusubcomponent navbar'>

      <div className='menusubcomponent__header'>
        <div className='menusubcomponent__responsive d-lg-none'>
          <button className='menusubcomponent__responsive__button iconBtn' type='button'>
            <i className='fa fa-fw fa-bars' />
          </button>
        </div>

        <div className='menusubcomponent__menutitle primaryColorFontDarken'>Menu</div>
      </div>

      <ul className='menusubcomponent__list nav flex-column'>
        <li
          className={classnames('menusubcomponent__list__item nav-item', {'active primaryColorBgLighten': props.activeSubMenu.name === 'personalData'})}
          onClick={() => props.onClickMenuItem('personalData')}
          key={'personalData'}
        >
          <div className='menusubcomponent__list__item__link nav-link'>{props.t('My profil')}</div>
        </li>

        <li
          className={classnames('menusubcomponent__list__item nav-item', {'active primaryColorBgLighten': props.activeSubMenu.name === 'notification'})}
          onClick={() => props.onClickMenuItem('notification')}
          key={'notification'}
        >
          <div className='menusubcomponent__list__item__link nav-link'>{props.t('Shared spaces and notifications')}</div>
        </li>

        <li
          className={classnames('menusubcomponent__list__item nav-item', {'active primaryColorBgLighten': props.activeSubMenu.name === 'password'})}
          onClick={() => props.onClickMenuItem('password')}
          key={'password'}
        >
          <div className='menusubcomponent__list__item__link nav-link'>{props.t('Password')}</div>
        </li>

        {/*
        <li
          className={classnames('menusubcomponent__list__item nav-item', {'active primaryColorBgLighten': props.activeSubMenu.name === 'timezone'})}
          onClick={() => props.onClickMenuItem('timezone')}
          key={'timezone'}
        >
          <div className='menusubcomponent__list__item__link nav-link'>{props.t('Timezone')}</div>
        </li>
        */}
      </ul>
    </nav>
  )
}

export default translate()(MenuSubComponent)
