import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./RecentActivity.styl')

export const RecentActivity = props =>
  <div className='activity'>
    <div className='activity__header'>
      <div className={classnames('activity__header__title', 'subTitle')}>
        {props.t('Recent activity')}
      </div>

      <button
        className={classnames('activity__header__allread', 'btn', 'actionBtn', 'primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover')}
        onClick={props.onClickEverythingAsRead}
      >
        {props.t('Mark everything as read')}
      </button>
    </div>

    <div className='activity__wrapper'>
      {props.recentActivityList.map(content => {
        const contentType = props.contentTypeList.find(ct => ct.slug === content.type) || {hexcolor: '', faIcon: ''}
        return (
          <div
            className={classnames('activity__workspace primaryColorBgLightenHover', {'read': props.readByUserList.includes(content.id)})}
            onClick={() => props.onClickRecentContent(content.id, content.type)}
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
      })}

      <div className={classnames('activity__more', 'd-flex flex-row-reverse')}>
        <button
          className={classnames('activity__more__btn', 'btn', 'actionBtn', 'primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover')}
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
