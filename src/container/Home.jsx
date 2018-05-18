import React, { Component } from 'react'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import LogoHomepage from '../img/logoHeader.svg'

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
                  Bienvenue sur Tracim
                </div>
                <div className='homepagecard__thanks text-center'>
                  Merci de nous faire confiance et d'utiliser notre outil collaboratif
                </div>
                <div className='homepagecard__delimiter delimiter' />
                <div className='homepagecard__text text-center mb-5'>
                  Vous allez créez votre premier espace de travail
                </div>
                <div className='homepagecard__btn btn btn-outline-primary'>
                  Créer votre espace de travail
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

export default Home
