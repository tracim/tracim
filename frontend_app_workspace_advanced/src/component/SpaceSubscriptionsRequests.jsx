import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  DropdownMenu,
  NoHoverListItem,
  UserInfo
} from 'tracim_frontend_lib'

const SpaceSubscriptionsRequests = props => {
  return (
    props.subscriptionsRequests.length
      ? (
        <span className='workspace_advanced__subscriptionsRequest'>
          {props.subscriptionsRequests.map(request =>
            <NoHoverListItem
              key={`${request.author.user_id}_${request.created_date}`}
            >
              <UserInfo
                publicName={request.author.public_name}
                username={request.author.username}
              />

              {request.state === 'pending' && (
                <DropdownMenu
                  buttonLabel={props.t('Manage request')}
                  buttonCustomClass='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover workspace_advanced__subscriptionsRequest__button'
                  isButton
                >
                  <div
                    onClick={() => props.onClickAcceptRequest(request.author.user_id)}
                  >
                    <i className='fa fa-fw fa-check' />
                    {props.t('Accept request')}
                  </div>

                  <div
                    onClick={() => props.onClickRejectRequest(request.author.user_id)}
                  >
                    <i className='fa fa-fw fa-times' />
                    {props.t('Reject request')}
                  </div>
                </DropdownMenu>
              )}

              {request.state === 'accepted' && (
                <div
                  className='workspace_advanced__subscriptionsRequest__info'
                  title={props.t('by {{author}}', {
                    author: request.evaluator.public_name,
                    interpolation: { escapeValue: false }
                  })}
                >
                  <i className='fa fa-fw fa-check' />
                  {props.t('Request accepted')}
                </div>
              )}

              {request.state === 'rejected' && (
                <div
                  className='workspace_advanced__subscriptionsRequest__info'
                  title={props.t('by {{author}}', {
                    author: request.evaluator.public_name,
                    interpolation: { escapeValue: false }
                  })}
                >
                  <i className='fa fa-fw fa-times' />
                  {props.t('Request rejected')}
                </div>
              )}
            </NoHoverListItem>
          )}
        </span>
      )
      : <span className='workspace_advanced__subscriptionsRequest__empty'>{props.t('There are no requests yet.')}</span>
  )
}

export default translate()(SpaceSubscriptionsRequests)

SpaceSubscriptionsRequests.propTypes = {
  subscriptionsRequests: PropTypes.array.isRequired,
  onClickAcceptRequest: PropTypes.func,
  onClickRejectRequest: PropTypes.func
}

SpaceSubscriptionsRequests.defaultProps = {
  onClickAcceptRequest: () => { },
  onClickRejectRequest: () => { }
}
