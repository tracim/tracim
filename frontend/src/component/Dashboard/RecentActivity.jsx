import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Link } from 'react-router-dom'
import { Badge, ROLE } from 'tracim_frontend_lib'
import { PAGE } from '../../util/helper.js'

require('./RecentActivity.styl')

export const RecentActivity = props =>
  <div className='recentactivity'>
    <div className='recentactivity__header'>
      <div className='recentactivity__header__title subTitle'>
        {props.t('Recent activity')}
      </div>

      <button
        className='recentactivity__header__allread btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
        onClick={props.onClickMarkAllAsRead}
        disabled={props.recentActivityList.length === 0}
      >
        {props.t('Mark all as read')}
      </button>
    </div>

    <div className='recentactivity__list'>
      {(props.recentActivityList.length > 0
        ? props.recentActivityList.map(content => {
          const contentType = props.contentTypeList.find(ct => ct.slug === content.type) || { hexcolor: '', faIcon: '' }

          const recentActivityItemIcon = (
            <div className='recentactivity__list__item__icon' style={{ color: contentType.hexcolor }}>
              <i className={`fa fa-${contentType.faIcon}`} />
            </div>
          )

          const recentActivityItemName = (
            <div className='recentactivity__list__item__name'>
              {content.label}
              {content.type === 'file' && (
                <Badge text={content.fileExtension} customClass='badgeBackgroundColor' />
              )}
            </div>
          )

          if (content.type === 'folder' && props.roleIdForLoggedUser < ROLE.contentManager.id) {
            return (
              <div
                className={classnames('recentactivity__list__item nolink')}
                title={content.label}
                key={content.id}
              >
                {recentActivityItemIcon}
                {recentActivityItemName}
              </div>
            )
          } else {
            return (
              <Link
                className={classnames('recentactivity__list__item', { read: props.readByUserList.includes(content.id) })}
                to={PAGE.WORKSPACE.CONTENT(props.workspaceId, content.type, content.id)}
                title={content.label}
                key={content.id}
              >
                {recentActivityItemIcon}
                {recentActivityItemName}
              </Link>
            )
          }
        })
        : <div className='recentactivity__empty'>{props.t('No recent activity')}</div>
      )}

      <div
        className='recentactivity__more'
        style={{ display: props.recentActivityList.length === 0 ? 'none' : 'flex' }}
      >
        <button
          className='recentactivity__more__btn btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
          onClick={props.onClickSeeMore}
        >
          {props.t('See more')}
        </button>
      </div>
    </div>
  </div>

export default RecentActivity

RecentActivity.propTypes = {
  t: PropTypes.func.isRequired,
  recentActivityList: PropTypes.array.isRequired,
  contentTypeList: PropTypes.array.isRequired,
  onClickSeeMore: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  roleIdForLoggedUser: PropTypes.number.isRequired,
  readByUserList: PropTypes.array
}

RecentActivity.defaultProps = {
  readByUserList: []
}
