import React from 'react'
import { Link } from 'react-router-dom'
import { PAGE } from '../../../helper.js'

const AdminLink = props => {
  return (
    <li className='header__menu__rightside__adminlink'>
      <div className='adminlink dropdown'>
        <button className='adminlink__btn btn dropdown-toggle' type='button' data-toggle='dropdown'>
          Administration
        </button>

        <div className='adminlink__setting dropdown-menu' aria-labelledby='dropdownMenuButton'>
          <Link className='setting__link dropdown-item' to={PAGE.ADMIN.WORKSPACE}>
            <i className='fa fa-fw fa-space-shuttle mr-2' />
            {props.t('Admin workspace')}
          </Link>

          <Link className='setting__link dropdown-item' to={PAGE.ADMIN.USER}>
            <i className='fa fa-fw fa-users mr-2' />
            {props.t('Admin user')}
          </Link>
        </div>
      </div>
    </li>
  )
}

export default AdminLink
