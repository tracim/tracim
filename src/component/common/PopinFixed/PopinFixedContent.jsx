import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const PopinFixedContent = props => {
  return (
    <div className={classnames('wsFileGeneric__contentpage', `${props.customClass}`)}>
      <div className={classnames('wsFileGeneric__textnote', `${props.customClass}__textnote`)}>
      </div>

      <div className={classnames('wsFileGeneric__wrapper', `${props.customClass}__wrapper`)}>
        {props.children}
      </div>
    </div>
  )
}

export default PopinFixedContent

PopinFixedContent.propTypes = {

}
