import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import SelectStatus from '../Input/SelectStatus/SelectStatus.jsx'

const PopinFixedOption = props => {
  translate.setI18n(props.i18n ? props.i18n : i18n) // mandatory to allow Apps to overrides trad

  return (
    <div className={classnames('wsContentGeneric__option', `${props.customClass}__option`)}>
      <div className={classnames('wsContentGeneric__option__menu', `${props.customClass}__option__menu`)}>
        <div className='wsContentGeneric__option__menu__addversion btn mr-auto'>
          {props.t('PopinFixedOption.new_version')}
          <i className='fa fa-plus-circle' />
        </div>

        <SelectStatus />

        <div className={classnames('wsContentGeneric__option__menu__action', `${props.customClass}__option__menu__action`)}>
          <i className='fa fa-archive' />
        </div>
        <div className={classnames('wsContentGeneric__option__menu__action', `${props.customClass}__option__menu__action`)}>
          <i className='fa fa-trash' />
        </div>
      </div>
    </div>
  )
}

export default translate()(PopinFixedOption)

PopinFixedOption.propTypes = {
  i18n: PropTypes.object // translate resource to overrides default one
}
