import React from 'react'
import { translate } from 'react-i18next'
import {
  Avatar,
  AVATAR_SIZE,
  Icon,
  ListItemWrapper,
  PAGE
} from 'tracim_frontend_lib'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

require('./AdvancedSearchUserList.styl')

export const AdvancedSearchUserList = props => {
  return (
    <div>
      {props.userSearch.resultList.length > 0 && (
        <div className='content__header'>
          <div className='advancedSearchUser__avatar__header'>
            {props.t('Avatar')}
          </div>
          <div className='advancedSearchUser__name'>
            {props.t('Full name')}
          </div>
          <div className='advancedSearchUser__information'>
            {props.t('Information__plural')}
          </div>
        </div>
      )}
      {props.userSearch.resultList.map((searchItem, index) => (
        <ListItemWrapper
          label={searchItem.publicName}
          read
          contentType={searchItem}
          isLast={index === props.userSearch.resultList.length - 1}
          isFirst={index === 0}
          key={searchItem.userId}
        >
          <Link
            to={`${PAGE.PUBLIC_PROFILE(searchItem.userId)}`}
            className='advancedSearchUser'
          >
            <div
              className='advancedSearchUser__avatar__content'
            >
              <Avatar
                size={AVATAR_SIZE.SMALL}
                apiUrl={props.apiUrl}
                user={searchItem}
              />
            </div>

            <div
              className='advancedSearchUser__name'
              title={searchItem.publicName}
            >
              {searchItem.publicName}
            </div>

            {searchItem.username && (
              <div className='advancedSearchUser__information'>
                <Icon
                  icon='fas fa-at'
                  title={props.t('Username')}
                />
                <span title={searchItem.username}>{searchItem.username}</span>
              </div>
            )}
          </Link>
        </ListItemWrapper>
      ))}
    </div>
  )
}

export default translate()(AdvancedSearchUserList)

AdvancedSearchUserList.propTypes = {
  userSearch: PropTypes.object.isRequired,
  apiUrl: PropTypes.string.isRequired
}
