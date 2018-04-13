import React, { Component } from 'react'
import LogoHomepage from '../../img/logoHeader.svg'

class HomepageCard extends Component {
  render () {
    return (
      <div className='card homepagecard'>
        <div className='card-body homepagecard__body'>
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
      </div>
    )
  }
}

export default HomepageCard
