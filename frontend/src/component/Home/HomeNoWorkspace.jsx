import React from 'react'
import { translate } from 'react-i18next'

import { IconButton } from 'tracim_frontend_lib'

require('./Home.styl')

const getWorkspaceMessage = (canCreate, canJoin) => {
  if (canCreate && canJoin) return 'You can join an existing space or create your first space'
  if (canCreate && !canJoin) return 'You can create your first space'
  if (!canCreate && canJoin) return 'You can join an existing space'
  return 'Please ask access to spaces to an administrator or space manager'
}

export const HomeNoWorkspace = props =>
  <>
    <div className='homepagecard__title primaryColorFont'>
      {props.t('Welcome to Tracim')}
    </div>

    <div className='homepagecard__thanks'>
      {props.t('Thank you for trusting us and using our collaborative tool')}
    </div>

    <div className='homepagecard__delimiter delimiter primaryColorBg' />

    <div className='homepagecard__text'>
      <div className='homepagecard__text__user__top'>
        {props.t("You aren't member of any space yet")}
      </div>
      {props.t(getWorkspaceMessage(props.canCreateWorkspace, props.canJoinWorkspace))}
    </div>
    <span class='homepagecard__buttons'>
      {props.canCreateWorkspace && (
        <IconButton
          dataCy='homepagecard__create_btn'
          onClick={props.onClickCreateWorkspace}
          text={props.t('Create a space')}
          icon='plus'
        />
      )}

      {props.canJoinWorkspace && (
        <IconButton
          dataCy='homepagecard__join_btn'
          onClick={props.onClickJoinWorkspace}
          icon='users'
          text={props.t('Join a space')}
          intent='primary'
          mode='light'
        />
      )}
    </span>

    <div className='homepagecard__endtext'>
      {props.t('Have a good day!')}
    </div>
  </>

export default translate()(HomeNoWorkspace)
