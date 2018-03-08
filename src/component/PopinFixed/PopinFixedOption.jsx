import React from 'react'
// import classnames from 'classnames'
// import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import SelectStatus from '../Input/SelectStatus/SelectStatus.jsx'

translate.setI18n(i18n)

const PopinFixedOption = props => {
  return (
    <div className='wsFileGeneric__option'>
      <div className='wsFileGeneric__option__menu'>

        <div className='wsFileFile__option__menu__addversion btn mr-auto'>
          {props.t('PopinFixedOption.new_version')}
          <i className='fa fa-plus-circle' />
        </div>

        <SelectStatus />

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

export default translate()(PopinFixedOption)

PopinFixedOption.propTypes = {

}
