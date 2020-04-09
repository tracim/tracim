import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../appFactory.js'
import {
  workspaceConfig
} from '../helper.js'
import { buildHeadTitle, CUSTOM_EVENT } from 'tracim_frontend_lib'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import HomeNoWorkspace from '../component/Home/HomeNoWorkspace.jsx'
import HomeHasWorkspace from '../component/Home/HomeHasWorkspace.jsx'

export class Home extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
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

    if (props.system.config.instance_name) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('Home'), props.system.config.instance_name]) }
      })
    }
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
                {props.workspaceList.length > 0
                  ? <HomeHasWorkspace user={props.user} />
                  : (
                    <HomeNoWorkspace
                      canCreateWorkspace={props.canCreateWorkspace}
                      onClickCreateWorkspace={this.handleClickCreateWorkspace}
                    />
                  )}
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system }) => ({ user, workspaceList, system })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(Home))))
