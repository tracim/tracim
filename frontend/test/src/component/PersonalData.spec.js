import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { PersonalData as PersonalDataWithoutHOC } from '../../../src/component/Account/PersonalData.jsx'
import { translateMock } from '../../hocMock/translate.js'
import { connectMock } from '../../hocMock/store.js'

describe('<PersonnalData />', () => {
  const onClickSubmitCallBack = sinon.stub()

  const props = {
    onClickSubmit: onClickSubmitCallBack,
    displayAdminInfo: false,
    userAuthType: 'randomUserAuthType'
  }

  const mapStateToProps = {}

  const ComponentWithHoc = connectMock(mapStateToProps)(translateMock()(PersonalDataWithoutHOC))

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  const wrapperInstance = wrapper.find('PersonalData')

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
      wrapperInstance.instance().handleChangeName({ target: { value: randomText } })
      expect(wrapperInstance.state('newName')).to.equal(randomText)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapperInstance.instance().handleChangeEmail({ target: { value: randomText } })
      expect(wrapperInstance.state('newEmail')).to.equal(randomText)
    })

    it('handleChangeNewPassword should change the state', () => {
      wrapperInstance.instance().handleChangeCheckPassword({ target: { value: randomText } })
      expect(wrapperInstance.state('checkPassword')).to.equal(randomText)
    })
  })
})
