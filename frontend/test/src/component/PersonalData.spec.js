import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { PersonalData as PersonalDataWithoutHOC } from '../../../src/component/Account/PersonalData.jsx'

describe('<PersonnalData />', () => {
  const onClickSubmitCallBack = sinon.spy()

  const props = {
    onClickSubmit: onClickSubmitCallBack,
    displayAdminInfo: false,
    userAuthType: 'randomUserAuthType'
  }

  const wrapper = shallow(<PersonalDataWithoutHOC {...props} t={key => key} />)

  describe('handlers', () => {
    it('onClickSubmitCallBack should be called when the button is clicked and the new password is valid', () => {
      for (let i = 0; i < wrapper.find('input.personaldata__form__txtinput').length; i++) {
        wrapper.find('input.personaldata__form__txtinput').at(i).simulate('change', { target: { value: 'newRandomPassWord' } })
      }
      wrapper.find('button').simulate('click')
      expect(onClickSubmitCallBack.called).to.equal(true)
    })
  })

  describe('intern functions', () => {
    const randomText = 'randomText'
    it('handleChangeUserName should change the state', () => {
      wrapper.instance().handleChangePublicName({ target: { value: randomText } })
      expect(wrapper.state('newPublicName')).to.equal(randomText)
    })

    it('handleChangeUserName should change the state', () => {
      wrapper.instance().handleChangeUserName({ target: { value: randomText } })
      expect(wrapper.state('newUserName')).to.equal(randomText)
    })

    it('handleChangeEmail should change the state', () => {
      wrapper.instance().handleChangeEmail({ target: { value: randomText } })
      expect(wrapper.state('newEmail')).to.equal(randomText)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapper.instance().handleChangeCheckPassword({ target: { value: randomText } })
      expect(wrapper.state('checkPassword')).to.equal(randomText)
    })
  })
})
