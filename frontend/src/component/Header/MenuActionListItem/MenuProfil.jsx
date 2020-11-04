import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { PAGE } from '../../../util/helper.js'
import { translate } from 'react-i18next'
import { Avatar, DropdownMenu } from 'tracim_frontend_lib'

require('./MenuProfil.styl')

export const MenuProfil = props => {
  if (!props.user.logged) return null

  return (
    <li className='menuprofil'>
      <DropdownMenu
        buttonOpts={
          <Avatar
            width='40px'
            publicName={props.user.publicName}
          />
        }
        buttonLabel={props.user.publicName}
        buttonCustomClass='menuprofil__dropdown__name nohover'
        menuCustomClass='menuprofil__dropdown__setting'
        buttonDataCy='menuprofil__dropdown__button'
      >
        <Link
          to={PAGE.ACCOUNT}
          data-cy='menuprofil__dropdown__account__link'
          childrenKey='menuprofil__dropdown__account__link'
        >
          <i className='fa fa-fw fa-user-o' />
          {props.t('My Account')}
        </Link>

        <button
          className='transparentButton'
          onClick={props.onClickLogout}
          data-cy='menuprofil__dropdown__logout__link'
          childrenKey='menuprofil__dropdown__logout__link'
        >
          <i className='fa fa-fw fa-sign-out' />
          {props.t('Logout')}
        </button>
      </DropdownMenu>
    </li>
  )
}
export default translate()(MenuProfil)

MenuProfil.propTypes = {
  user: PropTypes.object.isRequired,
  onClickLogout: PropTypes.func.isRequired
}
