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
// import PropTypes from 'prop-types'

require('./AdvancedSearchUserList.styl')

// TODO - G.B. - 2021-02-16 - This component should be updated at https://github.com/tracim/tracim/issues/4097

export const AdvancedSearchUserList = props => {
  return (
    <>
      <div className='content__header'>
        <div className='advancedSearchUser__avatar__header'>
          {props.t('Avatar')}
        </div>
        <div className='advancedSearchUser__name'>
          {props.t('Full name')}
        </div>
        <div className='advancedSearchUser__information'>
          {props.t('Information_plural')}
        </div>
      </div>

      {props.userSearch.resultList.map((searchItem, index) => (
        <ListItemWrapper
          label={searchItem.label}
          read
          contentType={props.user}
          isLast={index === props.userSearch.resultList.length - 1}
          key={searchItem.contentId}
        >
          <Link
            to={`${PAGE.PUBLIC_PROFILE(searchItem.contentId)}`}
            className='advancedSearchUser'
          >
            <div
              className='advancedSearchUser__avatar__content'
            >
              <Avatar
                size={AVATAR_SIZE.SMALL}
                apiUrl={props.apiUrl}
                user={props.user}
              />
            </div>

            <div
              className='advancedSearchUser__name'
              title={searchItem.label}
            >
              {searchItem.label}
            </div>

            <div className='advancedSearchUser__information'>
              <span>username</span>
              <Icon
                icon='fa-fw fas fa-at'
                title={props.t('Username')}
              />
            </div>
          </Link>
        </ListItemWrapper>
      ))}
    </>
  )
}

export default translate()(AdvancedSearchUserList)
