import React from 'react'
import classnames from 'classnames'


require('./MenuSubComponent.styl')

export const MenuSubComponent = props => {
  return (
    <nav className='menusubcomponent navbar d-flex align-items-start'>

      <div className='menusubcomponent__responsive d-lg-none'>
        <button className='hamburger hamburger--spring menusubcomponent__responsive__hamburger' type='button'>
          <span className='hamburger-box menusubcomponent__responsive__hamburger__box'>
            <span className='hamburger-inner menusubcomponent__responsive__hamburger__box__icon' />
          </span>
        </button>
      </div>

      <ul className='menusubcomponent__list nav flex-column'>

        <li className='menusubcomponent__list__close nav-link'>
          <i className='fa fa-times' />
        </li>

        <li className='menusubcomponent__list__disabled'>Menu</li>
        { props.subMenuList.map(sm =>
          <li
            className={classnames('menusubcomponent__list__item nav-item', {'active primaryColorBgLighten': sm.active})}
            onClick={() => props.onClickMenuItem(sm.name)}
            key={sm.name}
          >
            <div className='menusubcomponent__list__item__link nav-link'>{sm.menuLabel}</div>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default MenuSubComponent
