import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import Icon from '../Icon/Icon.jsx'

const ContentType = props => {
  return (
    <div
      className={classnames('contentType', props.customClass)}
      style={{ color: props.contentTypeInfo.hexcolor }}
    >
      <Icon
        icon={props.contentTypeInfo.faIcon}
        title={props.t(props.contentTypeInfo.label)}
        color={props.contentTypeInfo.hexcolor}
      />
      <span>{props.t(props.contentTypeInfo.label)}</span>
    </div>
  )
}

ContentType.propTypes = {
  contentTypeInfo: PropTypes.object.isRequired,
  customClass: PropTypes.string
}

ContentType.defaultProps = {
  customClass: null
}

export default translate()(ContentType)
