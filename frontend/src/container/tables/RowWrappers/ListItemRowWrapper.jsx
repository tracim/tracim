import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  ListItemWrapper,
  PAGE
} from 'tracim_frontend_lib'

const ListItemRowWrapper = (props) => {
  const { content } = props
  const contentTypeInfo = props.contentType.find(info => info.slug === content.type)
  const contentAppUrl = PAGE.WORKSPACE.CONTENT(
    content.workspaceId,
    contentTypeInfo.slug,
    content.id
  )

  return (
    <ListItemWrapper
      label={content.label}
      read
      contentType={contentTypeInfo}
      isLast={props.isLast}
      isFirst={props.isFirst}
      customClass={props.customClass}
      dataCy={props.dataCy}
    >
      <Link
        to={contentAppUrl}
        className={`${props.customClass}__link`}
      />
      {props.children}
    </ListItemWrapper>
  )
}

ListItemRowWrapper.propsType = {
  content: PropTypes.object.isRequired,
  isLast: PropTypes.bool,
  isFirst: PropTypes.bool,
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

ListItemRowWrapper.defaultProps = {
  isLast: false,
  isFirst: false,
  customClass: null,
  dataCy: null
}

const mapStateToProps = ({ contentType }) => ({ contentType })

export default connect(mapStateToProps)(ListItemRowWrapper)
