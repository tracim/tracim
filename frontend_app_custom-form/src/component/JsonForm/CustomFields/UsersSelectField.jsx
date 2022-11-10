import React from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import {
  handleFetchResult,
  getSpaceMemberList,
  sendGlobalFlashMessage
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

const animatedComponents = makeAnimated()

export class UsersSelectField extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      users: []
    }
  }

  componentDidMount = () => {
    this.fetchUsers().catch((r) => {
      sendGlobalFlashMessage('Error while fetching users')
    })
  }

  fetchUsers = async () => {
    const formContext = this.props.formContext
    if (formContext.apiUrl === undefined && formContext.workspaceId === undefined) return
    const fetchUsersResponse = await handleFetchResult(await getSpaceMemberList(formContext.apiUrl, formContext.workspaceId))
    switch (fetchUsersResponse.apiResponse.status) {
      case 200 :
        this.setState({
          users: fetchUsersResponse.body.map((u) => ({
            value: u.user_id,
            label: u.user.public_name
          }))
        })
        break
      default :
        sendGlobalFlashMessage('Error while fetch users')
        break
    }
  }

  render () {
    const { props, state } = this
    return (
      <div>
        <label
          className='control-label'
        >
          {props.schema.title ? props.schema.title : props.t('Title undefined')}
        </label>

        <Select
          isDisabled={props.disabled}
          components={animatedComponents}
          isMulti
          value={props.formData ? props.formData : ''}
          options={state.users}
          onChange={props.onChange}
        />
      </div>
    )
  }
}

export default translate()(UsersSelectField)

UsersSelectField.defaultProps = {
  disabled: false,
  formContext: {}
}

UsersSelectField.propType = {
  onChange: PropTypes.func,
  schema: PropTypes.object,
  formData: PropTypes.object,
  disabled: PropTypes.bool,
  formContext: PropTypes.object
}
