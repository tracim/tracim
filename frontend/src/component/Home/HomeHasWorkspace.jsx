import React from 'react'
import { translate } from 'react-i18next'
import { Avatar } from 'tracim_frontend_lib'

require('./Home.styl')

export const HomeHasWorkspace = props =>
  <div>
    <div className='homepagecard__title hasworkspace primaryColorFont'>
      {props.t('Welcome to Tracim')}
    </div>

    <div className='homepagecard__user'>
      <div className='homepagecard__user__avatar'>
        <Avatar publicName={props.user.publicName} width='75px' />
      </div>

      <div className='homepagecard__user__publicname'>
        {props.user.publicName}
      </div>
    </div>

    <div className='homepagecard__delimiter delimiter primaryColorBg' />

    <div className='homepagecard__text'>
      {props.t('Please select a space in the left sidebar by clicking on it')}
    </div>

    <div className='homepagecard__endtext'>
      {props.t('Have a good day!')}
    </div>
  </div>

export default translate()(HomeHasWorkspace)
