import React from 'react'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PAGE, workspaceConfig } from '../../../helper.js'

require('./AdminLink.styl')

const AdminLink = props => {
  return (
    <div className='adminlink dropdown'>
      <button className='adminlink__btn btn outlineTextBtn nohover primaryColorBorder dropdown-toggle' type='button' data-toggle='dropdown'>
        <i className='fa fa-fw fa-cog' />
        Administration
      </button>

      <div className='adminlink__setting dropdown-menu' aria-labelledby='dropdownMenuButton'>
        <Link className='adminlink__setting__link primaryColorBgLightenHover dropdown-item' to={PAGE.ADMIN.WORKSPACE}>
          <i className={`fa fa-fw fa-${workspaceConfig.faIcon} mr-2`} />
          {props.t('Shared spaces')}
        </Link>

        <Link className='adminlink__setting__link primaryColorBgLightenHover dropdown-item' to={PAGE.ADMIN.USER}>
          <i className='fa fa-fw fa-users mr-2' />
          {props.t('Users')}
        </Link>
        {/*<Link className='adminlink__setting__link primaryColorBgLightenHover dropdown-item' to={PAGE.ADMIN.FORM}>*/}
        {/*  <i className='fa fa-fw fa-users mr-2' />*/}
        {/*  /!* props.t('Users') */ }
        {/*  {'Formulaires'}*/}
        {/*</Link>*/}
      </div>
    </div>
  )
}

export default translate()(AdminLink)
