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
  selectedStatus: PropTypes.object,
  availableStatus: PropTypes.array,
  i18n: PropTypes.object, // translate resource to overrides default one,
  onClickNewVersionBtn: PropTypes.func,
  onChangeStatus: PropTypes.func,
  display: PropTypes.bool
}

PopinFixedOption.defaultProps = {
  availableStatus: [],
  i18n: {},
  onClickNewVersionBtn: () => {},
  display: true
}
