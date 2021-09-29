import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  Avatar,
  AVATAR_SIZE,
  Breadcrumbs,
  IconButton,
  BREADCRUMBS_TYPE,
  PAGE
} from 'tracim_frontend_lib'

import { FETCH_CONFIG } from '../../util/helper.js'

export const ProfileMainBar = props => {
  const hasUser = Object.keys(props.displayedUser).length > 0
  const title = props.t('Home')
  const breadcrumbsRoot = {
    link: PAGE.HOME,
    label: title,
    icon: 'fas fa-home',
    type: BREADCRUMBS_TYPE.CORE,
    isALink: true
  }
  return (
    <div className='profile__mainBar'>
      <div className='profile__mainBar__avatar' data-cy='profile-avatar'>
        <Avatar
          customClass='profile__mainBar__avatar__big'
          apiUrl={FETCH_CONFIG.apiUrl}
          user={hasUser ? props.displayedUser : {}}
          size={AVATAR_SIZE.BIG}
          dataCy='profile-avatar'
        />
        <Avatar
          customClass='profile__mainBar__avatar__medium'
          apiUrl={FETCH_CONFIG.apiUrl}
          user={hasUser ? props.displayedUser : {}}
          size={AVATAR_SIZE.MEDIUM}
        />
        {props.changeAvatarEnabled && (
          <IconButton
            title={props.t('Change avatar')}
            icon='fas fa-upload'
            onClick={props.onChangeAvatarClick}
            customClass='profile__mainBar__avatar__changeBtn'
            intent='pins'
            dataCy='profile_avatar_changeBtn'
          />
        )}
      </div>
      {hasUser
        ? (
          <div className='profile__mainBar__info__wrapper'>
            <div className='profile__mainBar__info'>
              <div className='profile__mainBar__info__user'>
                <div className='profile__mainBar__info__user__name'>{props.displayedUser.publicName} </div>
                {props.displayedUser.username && (
                  <div className='profile__mainBar__info__user__username__wrapper'>
                    <div className='profile__mainBar__info__user__username__separator'> - </div>
                    <div className='profile__mainBar__info__user__username'>@{props.displayedUser.username}</div>
                  </div>
                )}
              </div>
              <Breadcrumbs root={breadcrumbsRoot} breadcrumbsList={props.breadcrumbsList} />
            </div>
            { props.system.config.call__enabled && props.user.userId !== props.displayedUser.userId && (
              <IconButton
                title={props.t('Call')}
                text={props.t('Call')}
                icon='fas fa-phone'
                onClick={props.onClickDisplayCallPopup} // ici mettre le state createNewCall
                customClass='profile__mainBar__callBtn'
                // intent='pins'
                // dataCy='profile_avatar_changeBtn'
              />
            )}
          </div>
        )
        : (
          <div>
            <div className='profile__text__loading' />
            <div className='profile__text__loading' />
          </div>
        )}
    </div>
  )
}

ProfileMainBar.propTypes = {
  breadcrumbsList: PropTypes.array,
  displayedUser: PropTypes.object,
  onChangeAvatarClick: PropTypes.func.isRequired,
  changeAvatarEnabled: PropTypes.bool,
  onClickDisplayCallPopup: PropTypes.func // voir avec boolean
}

ProfileMainBar.defaultProps = {
  breadcrumbsList: [],
  displayedUser: { },
  changeAvatarEnabled: false
}

const mapStateToProps = ({ user, system }) => ({
  user, system
})

export default connect(mapStateToProps)(translate()(ProfileMainBar))
