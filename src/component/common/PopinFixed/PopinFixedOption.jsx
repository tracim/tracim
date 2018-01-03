import React from 'react'
// import classnames from 'classnames'
// import PropTypes from 'prop-types'

const PopinFixedOption = props => {
  return (
    <div className='wsFileGeneric__option'>
      <div className='wsFileGeneric__option__menu'>
        <div className='wsFileGeneric__option__menu__status dropdown'>
          <button className='wsFileGeneric__option__menu__status__dropdownbtn check btn dropdown-toggle' type='button' id='dropdownMenu2' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
            Validé
            <div className='wsFileGeneric__option__menu__status__dropdownbtn__icon'>
              <i className='fa fa-check' />
            </div>
          </button>
          <div className='wsFileGeneric__option__menu__status__submenu dropdown-menu' aria-labelledby='dropdownMenu2'>
            <h6 className='dropdown-header'>Statut du fichier</h6>
            <div className='dropdown-divider'></div>
            <button className='wsFileGeneric__option__menu__status__submenu__item current  dropdown-item' type='button'>
              En cours
              <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                <i className='fa fa-gears' />
              </div>
            </button>
            <button className='wsFileGeneric__option__menu__status__submenu__item check dropdown-item' type='button'>
              Validé
              <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                <i className='fa fa-check' />
              </div>
            </button>
            <button className='wsFileGeneric__option__menu__status__submenu__item invalid dropdown-item' type='button'>
              Invalidé
              <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                <i className='fa fa-times' />
              </div>
            </button>
            <button className='wsFileGeneric__option__menu__status__submenu__item ban dropdown-item' type='button'>
              Obsolète
              <div className='wsFileGeneric__option__menu__status__submenu__item__icon'>
                <i className='fa fa-ban' />
              </div>
            </button>
          </div>
        </div>
        <div className='wsFileGeneric__option__menu__action'>
          <i className='fa fa-archive' />
        </div>
        <div className='wsFileGeneric__option__menu__action'>
          <i className='fa fa-trash' />
        </div>
      </div>
    </div>
  )
}

export default PopinFixedOption

PopinFixedOption.propTypes = {

}
