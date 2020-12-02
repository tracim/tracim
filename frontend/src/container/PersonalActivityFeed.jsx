import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link, withRouter } from 'react-router-dom'

import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  PageTitle,
  TracimComponent
} from 'tracim_frontend_lib'

import ActivityList from '../component/Activity/ActivityList.jsx'
import { PAGE } from '../util/helper.js'
import {
  setBreadcrumbs,
  setHeadTitle,
  setUserActivityList,
  setUserActivityNextPage,
  resetUserActivity,
  setUserActivityEventList
} from '../action-creator.sync.js'
import { withActivity, ACTIVITY_COUNT_PER_PAGE } from './withActivity.jsx'

require('../css/ActivityFeed.styl')

export class PersonalActivityFeed extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(props.handleTlm)
  }

  componentDidMount () {
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true)
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle([props.t('Activity feed')])
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    const breadcrumbsList = [
      {
        link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: <Link to={PAGE.ACTIVITY_FEED}>{props.t('Activity feed')}</Link>,
        type: BREADCRUMBS_TYPE.CORE
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  render () {
    const { props } = this
    return (
      <div className='personalActivityFeed'>
        <PageTitle
          title={props.t('Activity feed')}
          icon='newspaper-o'
          iconTooltip={props.t('Activity feed')}
          breadcrumbsList={props.breadcrumbs}
        />
        <ActivityList
          activity={props.activity}
          onRefreshClicked={props.onRefreshClicked}
          onLoadMoreClicked={() => props.loadActivities(props.activity.list.length + ACTIVITY_COUNT_PER_PAGE)}
          onCopyLinkClicked={props.onCopyLinkClicked}
          onEventClicked={props.onEventClicked}
          showRefresh={props.showRefresh}
        />
      </div>
    )
  }
}

PersonalActivityFeed.propTypes = {
  loadActivities: PropTypes.func.isRequired,
  handleTlm: PropTypes.func.isRequired,
  onRefreshClicked: PropTypes.func.isRequired,
  onCopyLinkClicked: PropTypes.func.isRequired,
  onEventClicked: PropTypes.func
}

const mapStateToProps = ({ lang, user, userActivity, breadcrumbs }) => ({ lang, user, activity: userActivity, breadcrumbs })
const component = withActivity(
  TracimComponent(PersonalActivityFeed),
  setUserActivityList,
  setUserActivityNextPage,
  resetUserActivity,
  setUserActivityEventList
)
export default connect(mapStateToProps)(withRouter(translate()(component)))
