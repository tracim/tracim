import React, { Component } from 'react'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import LogoHomepage from '../img/logoHeader.svg'
import { translate } from 'react-i18next'

class Home extends Component {
  render () {
    return (
      <section className='homepage'>
        <div className='container-fluid nopadding'>
          <Card customClass='homepagecard'>
            <CardHeader /> {/* @TODO fix architecture of this component */}
            <CardBody customClass='homepagecard'>
              <div>
                <div className='homepagecard__title text-center my-4'>
                  {this.props.t('Welcome on Tracim')}
                </div>
                <div className='homepagecard__thanks text-center'>
                  {this.props.t('Thank you for trusting us and using our collaborative tool')}
                </div>
                <div className='homepagecard__delimiter delimiter' />
                <div className='homepagecard__text text-center mb-5'>
                  {this.props.t('You will create your first workspace')}
                </div>
                <div className='homepagecard__btn btn btn-outline-primary'>
                  {this.props.t('create a workspace')}
                </div>
                <div className='homepagecard__logo mt-5 mb-3'>
                  <img src={LogoHomepage} alt='logo homepage' />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    )
  }
}

export default translate()(Home)
