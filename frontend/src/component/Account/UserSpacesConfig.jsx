import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { BtnSwitch, IconButton, ConfirmPopup, ROLE_LIST } from 'tracim_frontend_lib'
import { newFlashMessage } from '../../action-creator.sync.js'
import { deleteWorkspaceMember } from '../../action-creator.async.js'

export class UserSpacesConfig extends React.Component {
  constructor (props) {
    super(props)
    this.state = { spaceBeingDeleted: null }
  }

  handleConfirmDeleteSpace = async () => {
    const { props } = this
    const spaceId = this.state.spaceBeingDeleted
    if (!spaceId) return
    this.setState({ spaceBeingDeleted: null })

    const fetchResult = await props.dispatch(deleteWorkspaceMember(spaceId, props.user.userId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
  }

  render = () => {
    const { props } = this
    return (
      <div className='account__userpreference__setting__spacename'>
        <div className='spaceconfig__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Spaces')}
        </div>

        <div className='spaceconfig__text ml-2 ml-sm-0' />

        <div className='spaceconfig__table'>
          <table className='table'>
            <thead>
              <tr>
                <th>{props.t('Space')}</th>
                <th>{props.t('Role')}</th>
                <th>{props.t('Email notifications')}</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {(props.workspaceList.length > 0
                ? props.workspaceList.map(ws => {
                  if (ws.memberList.length > 0) {
                    const mySelf = ws.memberList.find(u => u.id === props.userLoggedId)
                    const myRole = ROLE_LIST.find(r => r.slug === mySelf.role)
                    return (
                      <tr key={`ws_${ws.id}`}>
                        <td>
                          <div className='spaceconfig__table__spacename'>
                            {ws.label}
                          </div>
                        </td>

                        <td>
                          <div className='spaceconfig__table__role'>
                            <div className='spaceconfig__table__role__icon'>
                              <i className={`fa fa-fw fa-${myRole.faIcon}`} style={{ color: myRole.hexcolor }} />
                            </div>
                            <div className='spaceconfig__table__role__text d-none d-sm-flex'>
                              {props.t(myRole.label)}
                            </div>
                          </div>
                        </td>

                        <td>
                          <BtnSwitch
                            checked={mySelf.doNotify}
                            onChange={() => props.onChangeSubscriptionNotif(ws.id, !mySelf.doNotify)}
                          />
                        </td>
                        <td>
                          <IconButton
                            className='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                            onClick={() => this.setState({ leavingSpace: ws.id })}
                            icon='sign-out'
                            text={props.admin ? props.t('Remove from space') : props.t('Leave space')}
                          />
                        </td>
                      </tr>
                    )
                  }
                })
                : (
                  <tr>
                    <td colSpan={4}>
                      {
                        props.admin
                          ? props.t('This user is not a member of any space yet')
                          : props.t('You are not a member of any space yet')
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          {(this.state.spaceBeingDeleted && (
            <ConfirmPopup
              onConfirm={this.handleConfirmDeleteSpace}
              onCancel={() => this.setState({ spaceBeingDeleted: null })}
              msg={
                props.admin
                  ? props.t('Are you sure you want to remove this member from the space?')
                  : props.t('Are you sure you want to leave the space?')
              }
              confirmLabel={
                props.admin
                  ? props.t('Remove from space')
                  : props.t('Leave space')
              }
            />
          ))}
        </div>
      </div>
    )
  }
}

export default translate()(UserSpacesConfig)

UserSpacesConfig.propTypes = {
  workspaceList: PropTypes.arrayOf(PropTypes.object),
  userLoggedId: PropTypes.number,
  onChangeSubscriptionNotif: PropTypes.func,
  admin: PropTypes.bool
}

UserSpacesConfig.defaultProps = {
  workspaceList: [],
  onChangeSubscriptionNotif: () => { }
}
