import React from 'react'
import { translate } from 'react-i18next'
import {
  Icon,
  ListItemWrapper,
  PAGE,
  SPACE_TYPE_LIST
} from 'tracim_frontend_lib'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

require('./AdvancedSearchSpaceList.styl')

export const AdvancedSearchSpaceList = props => {
  const resultList = props.spaceSearch.resultList.map((searchItem) => {
    return {
      ...searchItem,
      accessType: {
        ...SPACE_TYPE_LIST.find(type => type.slug === searchItem.accessType) || { hexcolor: '', label: '', faIcon: '' }
      }
    }
  })
  return (
    <div>
      {props.spaceSearch.resultList.length > 0 && (
        <div className='content__header'>
          <div className='advancedSearchSpace__type__header'>
            {props.t('Type')}
          </div>
          <div className='advancedSearchSpace__name'>
            {props.t('Name')}
          </div>
          <div className='advancedSearchSpace__information'>
            {props.t('Information_plural')}
          </div>
        </div>
      )}

      {resultList.map((searchItem, index) => (
        <ListItemWrapper
          label={searchItem.label}
          read
          contentType={searchItem.accessType}
          isLast={index === resultList.length - 1}
          key={searchItem.workspaceId}
        >
          <Link
            to={{
              pathname: props.workspaceList.find(workspace => workspace.id === searchItem.workspaceId)
                ? `${PAGE.WORKSPACE.DASHBOARD(searchItem.workspaceId)}`
                : `${PAGE.JOIN_WORKSPACE}`,
              state: { fromSearch: true }
            }}
            className='advancedSearchSpace'
          >
            <div
              className='advancedSearchSpace__type__content'
              style={{ color: searchItem.accessType.slug !== SPACE_TYPE_LIST.CONFIDENTIAL ? searchItem.accessType.hexcolor : undefined }}
            >
              <Icon
                icon={`fa-fw ${searchItem.accessType.faIcon}`}
                title={props.t(searchItem.accessType.label)}
                color={searchItem.accessType.slug !== SPACE_TYPE_LIST.CONFIDENTIAL ? searchItem.accessType.hexcolor : undefined}
              />
              <span>{props.t(searchItem.accessType.label)}</span>
            </div>

            <div
              className='advancedSearchSpace__name'
              title={searchItem.label}
            >
              {searchItem.label}
            </div>

            <div className='advancedSearchSpace__information'>
              <span
                title={props.t('{{numberContents}} contents', { numberContents: searchItem.contentCount })}
              >
                {searchItem.contentCount}
              </span>
              <Icon
                icon='fa-fw fas fa-th'
                title={props.t('{{numberContents}} contents', { numberContents: searchItem.contentCount })}
              />

              <span
                title={props.t('{{numberMembers}} members', { numberMembers: searchItem.memberCount })}
              >
                {searchItem.memberCount}
              </span>
              <Icon
                icon='fa-fw far fa-user'
                title={props.t('{{numberMembers}} members', { numberMembers: searchItem.memberCount })}
              />
            </div>
          </Link>
        </ListItemWrapper>
      ))}
    </div>
  )
}

export default translate()(AdvancedSearchSpaceList)

AdvancedSearchSpaceList.propTypes = {
  spaceSearch: PropTypes.object.isRequired,
  workspaceList: PropTypes.array
}

AdvancedSearchSpaceList.defaultProps = {
  workspaceList: []
}
