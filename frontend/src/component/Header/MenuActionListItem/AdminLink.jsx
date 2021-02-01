import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import { workspaceConfig } from '../../../util/helper.js'
import { DropdownMenu, PAGE } from 'tracim_frontend_lib'

require('./AdminLink.styl')

const AdminLink = props => {
  return (
    <DropdownMenu
      buttonIcon='fas fa-cog'
      buttonLabel={props.t('Administration')}
      buttonCustomClass='adminlink__btn outlineTextBtn nohover'
      buttonDataCy='adminlink__dropdown__btn'
      isButton
    >
      <Link
        to={PAGE.ADMIN.WORKSPACE}
        data-cy='adminlink__workspace__link'
        key='adminlink__workspace__link'
      >
        <i className={`fa-fw ${workspaceConfig.faIcon}`} />
        {props.t('Spaces')}
      </Link>

      <Link
        to={PAGE.ADMIN.USER}
        data-cy='adminlink__user__link'
        key='adminlink__user__link'
      >
        <i className='far fa-fw fa-user' />
        {props.t('Users')}
      </Link>
    </DropdownMenu>
  )
}

export default translate()(AdminLink)
