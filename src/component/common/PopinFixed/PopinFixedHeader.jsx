import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const PopinFixedHeader = props => {
  return (
    <div className={classnames('wsFileGeneric__header', `${props.customClass}__header`)}>
      <div className={classnames('wsFileGeneric__header__icon', `${props.customClass}__header__icon`)}>
        <i className={props.icon} />
      </div>

      <div className={classnames('wsFileGeneric__header__title mr-auto', `${props.customClass}__header__title`)}>
        {props.name}
      </div>

      <div className={classnames('wsFileGeneric__header__close', `${props.customClass}__header__close`)}>
        <i className='fa fa-times' />
      </div>
    </div>
  )
}

export default PopinFixedHeader

PopinFixedHeader.propTypes = {
  icon: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  name: PropTypes.string
}

PopinFixedHeader.defaultProps = {
  customClass: '',
  name: ''
}
