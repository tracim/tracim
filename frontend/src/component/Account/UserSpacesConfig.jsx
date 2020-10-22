import React from 'react'
import { connect } from 'react-redux'
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

    const fetchResult = await props.dispatch(deleteWorkspaceMember(spaceId, props.userToEditId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
  }

  render = () => {
    const { props } = this

    const entries = props.workspaceList.map(space => {
      if (space.memberList.length > 0) {
        const member = space.memberList.find(u => u.id === props.userToEditId)
        if (!member) return
        const memberRole = ROLE_LIST.find(r => r.slug === member.role)
        return (
          <tr key={space.id}>
            <td>
              <div className='spaceconfig__table__spacename'>
                {space.label}
              </div>
            </td>

            <td>
              <div className='spaceconfig__table__role'>
                <div className='spaceconfig__table__role__icon'>
                  <i className={`fa fa-fw fa-${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />
                </div>
                <div className='spaceconfig__table__role__text d-none d-sm-flex'>
                  {props.t(memberRole.label)}
                </div>
              </div>
            </td>

            <td>
              <BtnSwitch
                checked={member.doNotify}
                onChange={() => props.onChangeSubscriptionNotif(space.id, !member.doNotify)}
              />
            </td>
            <td>
              <IconButton
                className='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                onClick={() => this.setState({ spaceBeingDeleted: space.id })}
                icon='sign-out'
                text={props.admin ? props.t('Remove from space') : props.t('Leave space')}
              />
            </td>
          </tr>
        )
      }
    }).filter(entry => entry)

    return (
      <div className='account__userpreference__setting__spacename'>
        <div className='spaceconfig__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Spaces')}
        </div>

        <div className='spaceconfig__text ml-2 ml-sm-0' />

        {(entries.length ? (
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

              <tbody>{entries}</tbody>
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
        ) : (
          props.admin
            ? props.t('This user is not a member of any space yet')
            : props.t('You are not a member of any space yet')
        ))}
      </div>
    )
  }
}

const mapStateToProps = ({ workspaceList }) => ({ workspaceList })
export default connect(mapStateToProps)(translate()(UserSpacesConfig))

UserSpacesConfig.propTypes = {
  workspaceList: PropTypes.arrayOf(PropTypes.object),
  userToEditId: PropTypes.number,
  onChangeSubscriptionNotif: PropTypes.func,
  admin: PropTypes.bool
}

UserSpacesConfig.defaultProps = {
  workspaceList: [],
  onChangeSubscriptionNotif: () => { }
}
