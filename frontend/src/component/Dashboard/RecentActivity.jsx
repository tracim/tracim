import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export const RecentActivity = props =>
  <div className={props.customClass}>
    <div className={`${props.customClass}__header`}>
      <div className={classnames(`${props.customClass}__header__title`, 'subTitle')}>
        {props.t('Recent activity')}
      </div>

      <div className={classnames(`${props.customClass}__header__allread`, 'btn btn-outline-primary')}>
        {props.t('Mark everything as read')}
      </div>
    </div>

    <div className={`${props.customClass}__wrapper`}>
      {props.recentActivityFilteredForUser.map(content => {
        const contentType = props.contentTypeList.find(ct => ct.slug === content.type)
        return (
          <div className={`${props.customClass}__workspace`} key={content.id}>
            <div className={`${props.customClass}__workspace__icon`} style={{color: contentType.hexcolor}}>
              <i className={`fa fa-${contentType.faIcon}`} />
            </div>
            <div className={`${props.customClass}__workspace__name`}>
              {content.label}
            </div>
          </div>
        )
      })}

      <div className={classnames(`${props.customClass}__more`, 'd-flex flex-row-reverse')}>
        <div
          className={classnames(`${props.customClass}__more__btn`, 'btn btn-outline-primary')}
          onClick={props.onClickSeeMore}
        >
          {props.t('See more')}
        </div>
      </div>
    </div>
  </div>

export default RecentActivity

RecentActivity.propTypes = {
  t: PropTypes.func.isRequired,
  recentActivityFilteredForUser: PropTypes.array.isRequired,
  contentTypeList: PropTypes.array.isRequired,
  onClickSeeMore: PropTypes.func.isRequired
}
