import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

require('./MenuSubComponent.styl')

export const MenuSubComponent = props => {
  const activeSubMenu = (props.menu.find(scm => scm.active) || { name: '' }).name

  return (
    <nav className='menusubcomponent navbar'>

      <div className='menusubcomponent__header'>
        <div className='menusubcomponent__menutitle primaryColorFontDarken'>{props.t('Account Settings')}</div>
      </div>

      <ul className='menusubcomponent__list nav flex-column'>
        {props.menu.map(menu =>
          <li
            className={classnames('menusubcomponent__list__item nav-item', { 'active primaryColorBgLighten': menu.name === activeSubMenu })}
            data-cy={`menusubcomponent__list__${menu.name}`}
            onClick={() => props.onClickMenuItem(menu.name)}
            key={menu.name}
          >
            <div className='menusubcomponent__list__item__link nav-link'>{props.t(menu.label)}</div>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default translate()(MenuSubComponent)

MenuSubComponent.propTypes = {
  menu: PropTypes.arrayOf(PropTypes.object),
  onClickMenuItem: PropTypes.func
}

MenuSubComponent.defaultProps = {
  menu: [],
  onClickMenuItem: () => {}
}
