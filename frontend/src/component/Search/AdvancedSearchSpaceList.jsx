import React from 'react'
import { translate } from 'react-i18next'
import {
  ListItemWrapper,
  displayDistanceDate,
  PAGE
} from 'tracim_frontend_lib'
import ContentItemSearch from './ContentItemSearch.jsx'
// import PropTypes from 'prop-types'

// require('./AdvancedSearchSpaceList.styl')

export const AdvancedSearchSpaceList = props => {
  return (
    props.searchResult.resultsList.map((searchItem, index) => (
      <ListItemWrapper
        label={searchItem.label}
        read
        contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.contentType) : null}
        isLast={index === props.searchResult.resultsList.length - 1}
        key={searchItem.contentId}
      >
        <ContentItemSearch
          label={searchItem.label}
          path={searchItem.workspace.label}
          lastModificationAuthor={searchItem.lastModifier}
          lastModificationTime={displayDistanceDate(searchItem.modified, props.user.lang)}
          lastModificationFormated={(new Date(searchItem.modified)).toLocaleString(props.user.lang)}
          fileExtension={searchItem.fileExtension}
          faIcon={props.contentType.length ? (props.contentType.find(ct => ct.slug === searchItem.contentType)).faIcon : null}
          statusSlug={searchItem.status}
          contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.contentType) : null}
          urlContent={`${PAGE.WORKSPACE.CONTENT(searchItem.workspaceId, searchItem.contentType, searchItem.contentId)}`}
          key={searchItem.contentId}
        />
      </ListItemWrapper>
    ))
  )
}

export default translate()(AdvancedSearchSpaceList)
