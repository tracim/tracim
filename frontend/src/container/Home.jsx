import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'

import {
  workspaceConfig
} from '../util/helper.js'
import {
  CUSTOM_EVENT,
  TracimComponent,
  PAGE
} from 'tracim_frontend_lib'
import { setHeadTitle } from '../action-creator.sync.js'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import HomeNoWorkspace from '../component/Home/HomeNoWorkspace.jsx'

export class Home extends React.Component {
  constructor (props) {
    super(props)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => this.setHeadTitle()

  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
  }

  handleClickJoinWorkspace = () => {
    this.props.history.push(PAGE.JOIN_WORKSPACE)
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentDidMount () {
    this.setHeadTitle()
  }

  setHeadTitle = () => {
    const { props } = this

    props.dispatch(setHeadTitle(props.t('Home')))
  }

  render () {
    const { props } = this

    if (!props.system.workspaceListLoaded) return null

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview fullWidthFullHeight'>
          <section
            className='homepage'
            style={{ backgroundColor: props.workspaceList.length === 0 ? 'gray' : 'white' }}
          >
            <Card customClass='homepagecard'>
              <CardHeader displayHeader={false} />

              <CardBody formClass='homepagecard__body'>
                <HomeNoWorkspace
                  canCreateWorkspace={props.canCreateWorkspace}
                  canJoinWorkspace={props.accessibleWorkspaceList.length > 0}
                  onClickCreateWorkspace={this.handleClickCreateWorkspace}
                  onClickJoinWorkspace={this.handleClickJoinWorkspace}
                />
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system, accessibleWorkspaceList }) => ({ user, workspaceList, system, accessibleWorkspaceList })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(TracimComponent(Home)))))
