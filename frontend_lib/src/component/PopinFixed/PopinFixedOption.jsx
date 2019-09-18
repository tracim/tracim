import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

const PopinFixedOption = props => {
  return (
    <div
      className={classnames('wsContentGeneric__option', `${props.customClass}__option`)}
      style={{ display: props.display ? 'block' : 'none' }}
    >
      <div className={classnames('wsContentGeneric__option__menu', `${props.customClass}__option__menu`)}>
        {props.children}
      </div>
    </div>
  )
}

export default translate()(PopinFixedOption)

PopinFixedOption.propTypes = {
  customClass: PropTypes.string,
  display: PropTypes.bool
}

PopinFixedOption.defaultProps = {
  customClass: '',
  display: true
}
