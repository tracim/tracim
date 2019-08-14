import React from 'react'
import { expect, assert } from 'chai'
import { mount, configure } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import PasswordRoot ,{ Password } from '../../src/component/Account/Password'
import { shallowUntilTarget } from '../hocMock/helper.js'
import thunk from 'redux-thunk'
import sinon from 'sinon'

describe('<Password />', () => {
  const middleware = [thunk]
  const mockStore = configureMockStore(middleware)
  const store = mockStore({})

  const onClickSubmitCallBack = sinon.stub()
  const dispatchMock = sinon.stub()

  const props = {
    onClickSubmit: onClickSubmitCallBack,
    displayAdminInfo: false,
    dispatch: dispatchMock
  }

  const component = <PasswordRoot {...props} store={store} />

  const wrapper = shallowUntilTarget(component, Password)

  describe('static design', () => {
    it('should have one button', () => {
      expect(wrapper.find('button').length).to.equal(1)
    })
  })

  describe('handlers', () => {
    it('onChange should change the state with the newPassword', () => {
      const newPassword = 'newRandomPassWord'
      wrapper.find('input.personaldata__form__txtinput').first().simulate('change', { target: { value: newPassword } })
      expect(wrapper.state('oldPassword')).to.equal(newPassword)
    })

    it('onClickSubmitCallBack should not be called when the button is clicked but the new password is not valid', () => {
      wrapper.find('button').simulate('click')
      expect(onClickSubmitCallBack.called).to.equal(false)
    })

    it('onClickSubmitCallBack should be called when the button is clicked and the new password is valid', () => {
      for(let i=0; i < wrapper.find('input.personaldata__form__txtinput').length; i++) {
        wrapper.find('input.personaldata__form__txtinput').at(i).simulate('change', { target: { value: 'newRandomPassWord' } })
      }
      wrapper.find('button').simulate('click')
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
