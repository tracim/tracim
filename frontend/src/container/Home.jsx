import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../appFactory.js'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import logoHeader from '../img/logo-tracim.png'
import { translate } from 'react-i18next'
import { workspaceConfig } from '../helper.js'

class Home extends React.Component {
  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
  }

  render () {
    const { props } = this

    return (
      <section className='homepage primaryColorBg'>
        <div className='container-fluid nopadding'>
          <Card customClass='homepagecard'>
            <CardHeader displayHeader={false} />

            <CardBody customClass='homepagecard'>
              <div>
                <div className='homepagecard__title primaryColorFont'>
                  {props.t('Welcome to Tracim')}
                </div>

                <div className='homepagecard__thanks'>
                  {props.t('Thank you for trusting us and using our collaborative tool')}
                </div>

                <div className='homepagecard__delimiter delimiter primaryColorBg' />

                <div className='homepagecard__text'>
                  {props.canCreateWorkspace
                    ? props.t('You will create your first shared space')
                    : (
                      <div className='homepagecard__text__user'>
                        <div className='homepagecard__text__user__top'>
                          {props.t("You aren't member of any shared space yet")}
                        </div>
                        <div>{props.t('Please refer to an administrator or a trusted user')}</div>
                      </div>
                    )
                  }
                </div>

                {props.canCreateWorkspace && (
                  <button
                    className='homepagecard__btn btn highlightBtn primaryColorBg primaryColorBgDarkenHover'
                    onClick={this.handleClickCreateWorkspace}
                  >
                    {props.t('create a shared space')}
                  </button>
                )}

                <div className='homepagecard__endtext'>
                  {props.t('Have a good day !')}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(Home))))
