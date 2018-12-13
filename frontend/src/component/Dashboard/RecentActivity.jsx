import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Badge } from 'tracim_frontend_lib'

require('./RecentActivity.styl')

export const RecentActivity = props =>
  <div className='recentactivity'>
    <div className='recentactivity__header'>
      <div className='recentactivity__header__title subTitle'>
        {props.t('Recent activity')}
      </div>

      <button
        className='recentactivity__header__allread btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
        onClick={props.onClickEverythingAsRead}
        disabled={props.recentActivityList.length === 0}
      >
        {props.t('Mark everything as read')}
      </button>
    </div>

    <div className='recentactivity__list'>
      {props.recentActivityList.length > 0
        ? props.recentActivityList.map(content => {
          const contentType = props.contentTypeList.find(ct => ct.slug === content.type) || {hexcolor: '', faIcon: ''}
          return (
            <div
              className={classnames('recentactivity__list__item primaryColorBgLightenHover', {'read': props.readByUserList.includes(content.id)})}
              onClick={() => props.onClickRecentContent(content.id, content.type)}
              title={content.label}
              key={content.id}
            >
              <div className='recentactivity__list__item__icon' style={{color: contentType.hexcolor}}>
                <i className={`fa fa-${contentType.faIcon}`} />
              </div>
              <div className='recentactivity__list__item__name'>
                {content.label}
                {content.type === 'file' && (
                  <Badge text={content.fileExtension} customClass='badgeBackgroundColor' />
                )}
              </div>
            </div>
          )
        })
        : <div className='recentactivity__empty'>{props.t('No recent activity')}</div>
      }

      <div
        className='recentactivity__more'
        style={{display: props.recentActivityList.length === 0 ? 'none' : 'flex'}}
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
  readByUserList: PropTypes.array
}

RecentActivity.defaultProps = {
  readByUserList: []
}
