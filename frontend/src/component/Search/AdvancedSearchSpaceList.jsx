import React from 'react'
import { translate } from 'react-i18next'
import {
  CONTENT_TYPE,
  Icon,
  ListItemWrapper,
  PAGE
} from 'tracim_frontend_lib'
import { Link } from 'react-router-dom'
// import PropTypes from 'prop-types'

require('./AdvancedSearchSpaceList.styl')

// TODO - G.B. - 2021-02-16 - This component should be updated at https://github.com/tracim/tracim/issues/4097

export const AdvancedSearchSpaceList = props => {
  const resultList = props.spaceSearch.resultList.map((searchItem) => {
    return {
      ...searchItem,
      contentType: {
        ...props.contentType.find(ct => ct.slug === searchItem.contentType) || { hexcolor: '', label: '', faIcon: '' },
        status: props.contentType.find(ct => ct.slug === searchItem.contentType).availableStatuses.find(s => s.slug === searchItem.status) || { hexcolor: '', label: '', faIcon: '' }
      }
    }
  })

  return (
    <>
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

      {resultList.map((searchItem, index) => (
        <ListItemWrapper
          label={searchItem.label}
          read
          contentType={searchItem.contentType}
          isLast={index === resultList.length - 1}
          key={searchItem.contentId}
        >
          <Link
            to={`${PAGE.WORKSPACE.CONTENT(searchItem.workspaceId, searchItem.contentType.slug, searchItem.contentId)}`}
            className='advancedSearchSpace'
          >
            <div
              className='advancedSearchSpace__type__content'
              style={{ color: searchItem.contentType.slug !== CONTENT_TYPE.FILE ? searchItem.contentType.hexcolor : undefined }}
            >
              <Icon
                icon={`fa-fw ${searchItem.contentType.faIcon}`}
                title={props.t(searchItem.contentType.label)}
                color={searchItem.contentType.slug !== CONTENT_TYPE.FILE ? searchItem.contentType.hexcolor : undefined}
              />
              <span>{props.t(searchItem.contentType.label)}</span>
            </div>

            <div
              className='advancedSearchSpace__name'
              title={searchItem.label}
            >
              {searchItem.label}
            </div>

            <div className='advancedSearchSpace__information'>
              <span>3333</span>
              <i className='fa-fw fas fa-th' />
              <span>3333</span>
              <i className='fa-fw far fa-user' />
            </div>
          </Link>
        </ListItemWrapper>
      ))}
    </>
  )
}

export default translate()(AdvancedSearchSpaceList)
