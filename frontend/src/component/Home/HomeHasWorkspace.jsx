import React from 'react'
import { translate } from 'react-i18next'

require('./Home.styl')

export const HomeHasWorkspace = props =>
  <div>
    <div className='homepagecard__title hasworkspace primaryColorFont'>
      {props.t('Welcome to Tracim')}
    </div>

    <div className='homepagecard__user primaryColorFont'>
      <div className='homepagecard__user__avatar'>
        <img src={props.user.avatar_url} />
      </div>
      <div className='homepagecard__user__publicname'>
        {props.user.public_name}
      </div>
    </div>

    <div className='homepagecard__delimiter delimiter primaryColorBg' />

    <div className='homepagecard__text primaryColorFont'>
      {props.t('Please select a shared space in the left sidebar by clicking on it')}
    </div>

    <div className='homepagecard__endtext'>
      {props.t('Have a good day !')}
    </div>
  </div>

export default translate()(HomeHasWorkspace)
