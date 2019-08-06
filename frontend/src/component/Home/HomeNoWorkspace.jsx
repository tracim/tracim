import React from 'react'
import { translate } from 'react-i18next'

require('./Home.styl')

export const HomeNoWorkspace = props =>
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
        data-cy='homepagecard__btn'
        onClick={props.onClickCreateWorkspace}
      >
        {props.t('create a shared space')}
      </button>
    )}

    <div className='homepagecard__endtext'>
      {props.t('Have a good day !')}
    </div>
  </div>

export default translate()(HomeNoWorkspace)
