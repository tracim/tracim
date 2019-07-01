import React from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import { handleFetchResult } from 'tracim_frontend_lib'
import { getWorkspaceMemberList, getAllUsers } from '../../../action.async'
import Context from '../../Context'
import { translate } from 'react-i18next'

const animatedComponents = makeAnimated()
const userFroms = [
  'workspace',
  'all'
]

export class UsersSelectField extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      users: []
    }
    this.fetchUsers().catch((r) => {
      this.sendGlobalFlashMessage('Error while fetch users')
    })
  }

  componentDidMount = () => {

  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  fetchUsers = async () => {
    const p = this.props
    const userFrom = p.schema.userfrom
      ? userFroms.includes(p.schema.userfrom) ? p.schema.userfrom : 'all'
      : 'all'
    const context = new Context()
    if (context.getApiKey() === undefined && context.getWorkSpaceId() === undefined) return
    const fetchUsersResponse = await handleFetchResult(
      userFrom === 'workspace'
        ? await getWorkspaceMemberList(context.getApiKey(), context.getWorkSpaceId())
        : await getAllUsers(context.getApiKey())
    )
    switch (fetchUsersResponse.apiResponse.status) {
      case 200 :
        let usersTmp = fetchUsersResponse.body.map((u) =>
          ({
            value: u.user_id,
            label: userFrom === 'workspace' ? u.user.public_name : u.public_name
          }))
        this.setState({
          users: usersTmp
        })
        break
      default :
        this.sendGlobalFlashMessage('Error while fetch users')
        break
    }
  }

  render () {
    const p = this.props
    return (
      <div>
        <label
          className='control-label'>{p.schema.title ? p.schema.title : p.t('Title undefined')}</label>
        <Select
          isDisabled={p.disabled}
          components={animatedComponents}
          isMulti
          value={p.formData ? p.formData : ''}
          options={this.state.users}
          onChange={p.onChange}
        />
      </div>
    )
  }
}

export default translate()(UsersSelectField)
