import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { AddUserForm } from '../../src/component/AddUserForm.jsx'

describe('<AddUserForm />', () => {
  const props = {
    emailNotifActivated: true,
    isEmailRequired: true,
    isUsernameValid: true
  }

  const wrapper = shallow(<AddUserForm {...props} t={tradKey => tradKey} />)

  describe('its internal functions', () => {
    describe('isValidateButtonDisabled', () => {
      beforeEach(function () {
        wrapper.setState({
          newUserEmail: 'newEmail',
          newUserPassword: 'newPassword',
          newUserUsername: 'newUsername',
          newUserName: 'newName',
          newUserType: 'newType'
        })
      })

      it('should return true if the email notification are activated, the email and the password are empty', () => {
        wrapper.setState({ newUserPassword: '', newUserEmail: '' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the name or the profile are empty', () => {
        wrapper.setState({ newUserName: '', newUserType: '' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the email is required and empty', () => {
        wrapper.setState({ newUserEmail: '' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the email notification are deactivated and the password are empty', () => {
        wrapper.setState({ newUserPassword: '' })
        wrapper.setProps({ emailNotifActivated: false })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the username is not valid', () => {
        wrapper.setProps({ isUsernameValid: false })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the username is valid but empty and the email is empty', () => {
        wrapper.setProps({ isUsernameValid: true })
        wrapper.setState({ newUserEmail: '' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return false if all field required are filled with valid inputs', () => {
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(false)
      })
    })
  })
})
