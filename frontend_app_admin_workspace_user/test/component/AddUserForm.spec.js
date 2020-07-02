import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { AddUserForm } from '../../src/component/AddUserForm.jsx'

describe('<AddUserForm />', () => {
  const props = {
    emailNotifActivated: true,
    isEmailRequired: true,
    isUsernameValid: false
  }

  const wrapper = shallow(<AddUserForm {...props} t={tradKey => tradKey} />)

  describe('its internal functions', () => {
    describe('isValidateButtonDisabled', () => {
      it('should return true if the email notification are activated, the email and the password are empty', () => {
        wrapper.setState({ newUserEmail: '' })
        wrapper.setState({ newUserPassword: '' })
        wrapper.setState({ newUserName: '' })
        wrapper.setState({ newUserProfile: '' })
        wrapper.setState({ newUserUsername: '' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the name or the profile are empty', () => {
        wrapper.setProps({ emailNotifActivated: false })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the email notification are disactivated and the password are empty', () => {
        wrapper.setState({ newUserName: 'newName' })
        wrapper.setState({ newUserProfile: 'newProfile' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the email is required and empty', () => {
        wrapper.setState({ newUserPassword: 'newPassword' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the username is not valid', () => {
        wrapper.setProps({ isUsernameValid: false })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return true if the username is valid but empty and the email is empty', () => {
        wrapper.setProps({ isUsernameValid: true })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(true)
      })

      it('should return false if all field required are filled with valid inputs', () => {
        wrapper.setState({ newUserEmail: 'newEmail' })
        wrapper.setState({ newUserUsername: 'newUsername' })
        expect(wrapper.instance().isValidateButtonDisabled()).to.equal(false)
      })
    })
  })
})
