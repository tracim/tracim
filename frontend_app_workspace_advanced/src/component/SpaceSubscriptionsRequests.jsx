import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  DropdownMenu,
  NoHoverListItem,
  UserInfo
} from 'tracim_frontend_lib'

const SpaceSubscriptionsRequests = props => {
  console.log('AAAAAAAAAAAAAAAA', props) // todo if empty warning msg
  return (
    <div>
      {props.subscriptionsRequests.map(request =>
        <NoHoverListItem>
          <UserInfo
            publicName='a'
            username='b'
          />

          {request.status === 'pending' && (
            <DropdownMenu
              buttonLabel={props.t('Manage request')}
              buttonTooltip={props.t('Manage request')}
              buttonCustomClass='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
              isButton
            >
              <button>
                <i className='fa fa-fw fa-check' />
                {props.t('Accept request')}
              </button>
              <button>
                <i className='fa fa-fw fa-times' />
                {props.t('Reject request')}
              </button>
            </DropdownMenu>
          )}

          {request && (
            <div>
              <i className='fa fa-fw fa-check' />
              {props.t('Request accepted')}
            </div>
          )}

          {request && (
            <div>
              <i className='fa fa-fw fa-times' />
              {props.t('Request rejected')}
            </div>
          )}
        </NoHoverListItem>
      )}
    </div>
  )
}

export default translate()(SpaceSubscriptionsRequests)

SpaceSubscriptionsRequests.propTypes = {
  subscriptionsRequests: PropTypes.array.isRequired
}

SpaceSubscriptionsRequests.defaultProps = {
}
