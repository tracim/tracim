import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  DropdownMenu,
  formatAbsoluteDate,
  NoHoverListItem,
  UserInfo
} from 'tracim_frontend_lib'

export const SpaceSubscriptionsRequests = props => {
  return (
    props.subscriptionRequestList.length
      ? (
        <span className='workspace_advanced__subscriptionRequests'>
          {props.subscriptionRequestList.map(request =>
            <NoHoverListItem
              key={`${request.author.user_id}_${request.created_date}`}
            >
              <span className='workspace_advanced__subscriptionRequests__userInfo'>
                <UserInfo
                  publicName={request.author.public_name}
                  username={request.author.username}
                />
              </span>

              {request.state === 'pending' && (
                <DropdownMenu
                  buttonLabel={props.t('Manage request')}
                  buttonCustomClass='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover workspace_advanced__subscriptionRequests__button'
                  isButton
                >
                  <button
                    className='transparentButton'
                    onClick={() => props.onClickAcceptRequest(request.author.user_id)}
                  >
                    <i className='fa fa-fw fa-check' />
                    {props.t('Accept request')}
                  </button>

                  <button
                    className='transparentButton'
                    onClick={() => props.onClickRejectRequest(request.author.user_id)}
                  >
                    <i className='fa fa-fw fa-times' />
                    {props.t('Reject request')}
                  </button>
                </DropdownMenu>
              )}

              {request.state === 'accepted' && (
                <div
                  className='workspace_advanced__subscriptionRequests__info'
                  title={props.t('by {{author}} at {{date}}', {
                    author: request.evaluator.public_name,
                    date: formatAbsoluteDate(request.evaluation_date),
                    interpolation: { escapeValue: false }
                  })}
                >
                  <i className='fa fa-fw fa-check' />
                  {props.t('Request accepted')}
                </div>
              )}

              {request.state === 'rejected' && (
                <div
                  className='workspace_advanced__subscriptionRequests__info'
                  title={props.t('by {{author}} at {{date}}', {
                    author: request.evaluator.public_name,
                    date: formatAbsoluteDate(request.evaluation_date),
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
      : <span className='workspace_advanced__subscriptionRequests__empty'>{props.t('There are no requests yet.')}</span>
  )
}

export default translate()(SpaceSubscriptionsRequests)

SpaceSubscriptionsRequests.propTypes = {
  subscriptionRequestList: PropTypes.array.isRequired,
  onClickAcceptRequest: PropTypes.func,
  onClickRejectRequest: PropTypes.func
}

SpaceSubscriptionsRequests.defaultProps = {
  onClickAcceptRequest: () => { },
  onClickRejectRequest: () => { }
}
