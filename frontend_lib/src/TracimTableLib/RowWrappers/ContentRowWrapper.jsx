import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { PAGE } from '../../helper.js'
import ListItemWrapper from '../../component/Lists/ListItemWrapper/ListItemWrapper.jsx'

const ContentRowWrapper = (props) => {
  const contentTypeInfo = props.contentType.find(type => type.slug === props.originalType) || { slug: '' }
  const contentAppUrl = props.content ? PAGE.WORKSPACE.CONTENT(
    props.content.workspaceId,
    contentTypeInfo.slug,
    props.content.id
  ) : undefined

  return (
    <ListItemWrapper
      label={props.originalLabel}
      read={props.read}
      contentType={contentTypeInfo}
      isLast={props.isLast}
      isFirst={props.isFirst}
      customClass={props.customClass}
      dataCy={props.dataCy}
    >
      {contentAppUrl && (
        <Link
          to={contentAppUrl}
          className={`${props.customClass}__link`}
        />
      )}
      {props.children}
    </ListItemWrapper>
  )
}

ContentRowWrapper.propsType = {
  content: PropTypes.object.isRequired,
  originalType: PropTypes.string.isRequired,
  originalLabel: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  isLast: PropTypes.bool,
  isFirst: PropTypes.bool,
  read: PropTypes.bool,
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

ContentRowWrapper.defaultProps = {
  isLast: false,
  isFirst: false,
  read: false,
  customClass: null,
  dataCy: null
}

export default ContentRowWrapper
