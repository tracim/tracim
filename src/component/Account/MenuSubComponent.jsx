import React from 'react'
import classnames from 'classnames'

export const Navbar = props => {
  return (
    <nav className='account__userpreference__menu navbar d-flex align-items-start'>

      <div className='account__userpreference__menu__responsive d-lg-none'>
        <i className='fa fa-bars' />
      </div>

      <ul className='account__userpreference__menu__list nav flex-column'>

        <li className='account__userpreference__menu__list__close nav-link'>
          <i className='fa fa-times' />
        </li>

        <li className='account__userpreference__menu__list__disabled'>Menu</li>
        { props.subMenuList.map(sm =>
          <li
            className={classnames('account__userpreference__menu__list__item nav-item', {'active': sm.active})}
            onClick={() => props.onClickMenuItem(sm.name)}
            key={sm.name}
          >
            <div className='account__userpreference__menu__list__item__link nav-link'>{sm.menuLabel}</div>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default Navbar
