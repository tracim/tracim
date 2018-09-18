import React from 'react'
import classnames from 'classnames'

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
