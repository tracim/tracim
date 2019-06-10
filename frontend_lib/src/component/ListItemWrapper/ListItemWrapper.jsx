import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const ListItemWrapper = props => {
  if (props.contentType === null) return null // this means the endpoint system/content_type hasn't responded yet

  return (
    <div
      className={
        classnames('content primaryColorBgLightenHover', {'item-last': props.isLast, 'read': props.read}, props.customClass)
      }
    >
      {props.children}
    </div>
  )
}

export default translate()(ListItemWrapper)


ListItemWrapper.propTypes = {
  customClass: PropTypes.string,
  label: PropTypes.string,
  contentType: PropTypes.object,
  read: PropTypes.bool
}

ListItemWrapper.defaultProps = {
  label: '',
  customClass: '',
  read: false
}
