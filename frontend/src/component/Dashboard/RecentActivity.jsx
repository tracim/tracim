import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./RecentActivity.styl')

export const RecentActivity = props =>
  <div className='activity'>
    <div className='activity__header'>
      <div className='activity__header__title subTitle'>
        {props.t('Recent activity')}
      </div>

      <button
        className='activity__header__allread btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
        onClick={props.onClickEverythingAsRead}
        disabled={props.recentActivityList.length === 0}
      >
        {props.t('Mark everything as read')}
      </button>
    </div>

    <div className='activity__wrapper'>
      {props.recentActivityList.length > 0
        ? props.recentActivityList.map(content => {
          const contentType = props.contentTypeList.find(ct => ct.slug === content.type) || {hexcolor: '', faIcon: ''}
          return (
            <div
              className={classnames('activity__workspace primaryColorBgLightenHover', {'read': props.readByUserList.includes(content.id)})}
              onClick={() => props.onClickRecentContent(content.id, content.type)}
              title={content.label}
              key={content.id}
            >
              <div className='activity__workspace__icon' style={{color: contentType.hexcolor}}>
                <i className={`fa fa-${contentType.faIcon}`} />
              </div>
              <div className='activity__workspace__name'>
                {content.label}
              </div>
            </div>
          )
        })
        : <div className='activity__empty'>{props.t('No recent activity')}</div>
      }

      <div
        className='activity__more'
        style={{display: props.recentActivityList.length === 0 ? 'none' : 'flex'}}
      >
        <button
          className='activity__more__btn btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
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
