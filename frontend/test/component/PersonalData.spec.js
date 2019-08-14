import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import PersonalDataRoot, { PersonalData } from '../../src/component/Account/PersonalData'
import configureMockStore from 'redux-mock-store'
import { shallowUntilTarget } from '../hocMock/helper.js'

describe('<PersonnalData />', () => {
  const mockStore = configureMockStore()
  const store = mockStore({})
  const onClickSubmitCallBack = sinon.stub()

  const props = {
    onClickSubmit: onClickSubmitCallBack,
    displayAdminInfo: false,
    userAuthType: 'randomUserAuthType'
  }

  const component = <PersonalDataRoot {...props} store={store} />

  const wrapper = shallowUntilTarget(component, PersonalData)

  describe('handlers', () => {
    it('onClickSubmitCallBack should be called when the button is clicked and the new password is valid', () => {
      for(let i=0; i < wrapper.find('input.personaldata__form__txtinput').length; i++) {
        wrapper.find('input.personaldata__form__txtinput').at(i).simulate('change', { target: { value: 'newRandomPassWord' } })
      }
      wrapper.find('button').simulate('click')
      expect(onClickSubmitCallBack.called).to.equal(true)
    })
  })

  describe('intern functions', () => {
    const randomText = 'randomText'
    it('handleChangeOldPassword should change the state', () => {
      wrapper.instance().handleChangeName({ target: { value: randomText } })
      expect(wrapper.state('newName')).to.equal(randomText)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapper.instance().handleChangeEmail({ target: { value: randomText } })
      expect(wrapper.state('newEmail')).to.equal(randomText)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapper.instance().handleChangeCheckPassword({ target: { value: randomText } })
      expect(wrapper.state('checkPassword')).to.equal(randomText)
    })
  })
})
