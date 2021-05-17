import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { IconButton } from 'tracim_frontend_lib'
import { Password as PasswordWithoutHOC } from '../../../src/component/Account/Password.jsx'
import sinon from 'sinon'

describe('<Password />', () => {
  const onClickSubmitCallBack = sinon.spy()
  const dispatchMock = sinon.spy()

  const props = {
    onClickSubmit: onClickSubmitCallBack,
    displayAdminInfo: false,
    dispatch: dispatchMock
  }

  const wrapper = shallow(<PasswordWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('should have one button', () => {
      expect(wrapper.find(IconButton).length).to.equal(1)
    })
  })

  describe('handlers', () => {
    it('onChange should change the state with the newPassword', () => {
      const newPassword = 'newRandomPassWord'
      wrapper.find('input.personaldata__form__txtinput').first().simulate('change', { target: { value: newPassword } })
      expect(wrapper.state('oldPassword')).to.equal(newPassword)
    })

    it('onClickSubmitCallBack should not be called when the button is clicked but the new password is not valid', () => {
      wrapper.find(IconButton).simulate('click')
      expect(onClickSubmitCallBack.called).to.equal(false)
    })

    it('onClickSubmitCallBack should be called when the button is clicked and the new password is valid', () => {
      for (let i = 0; i < wrapper.find('input.personaldata__form__txtinput').length; i++) {
        wrapper.find('input.personaldata__form__txtinput').at(i).simulate('change', { target: { value: 'newRandomPassWord' } })
      }
      wrapper.find(IconButton).simulate('click')
      expect(onClickSubmitCallBack.called).to.equal(true)
    })
  })

  describe('intern functions', () => {
    const randomPassword = 'newRandomPassWord'
    it('handleChangeOldPassword should change the state', () => {
      wrapper.instance().handleChangeOldPassword({ target: { value: randomPassword } })
      expect(wrapper.state('oldPassword')).to.equal(randomPassword)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapper.instance().handleChangeNewPassword({ target: { value: randomPassword } })
      expect(wrapper.state('newPassword')).to.equal(randomPassword)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapper.instance().handleChangeNewPassword2({ target: { value: randomPassword } })
      expect(wrapper.state('newPassword2')).to.equal(randomPassword)
    })
  })
})
