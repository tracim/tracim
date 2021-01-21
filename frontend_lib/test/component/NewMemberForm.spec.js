import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import NewMemberForm from '../../src/component/NewMemberForm/NewMemberForm.jsx'
import { ROLE } from '../../src/helper.js'
require('../../src/component/NewMemberForm/NewMemberForm.styl')

describe('<NewMemberForm />', () => {
  const onClickCloseAddMemberBtnCallBack = sinon.spy()
  const onClickAutoCompleteCallBack = sinon.spy()
  const onClickBtnValidateCallBack = sinon.spy()
  const onChangeRoleCallBack = sinon.spy()
  const onClickKnownMemberCallBack = sinon.spy()
  const onChangePersonalDataCallBack = sinon.spy()

  const props = {
    onClickCloseAddMemberBtn: onClickCloseAddMemberBtnCallBack,
    publicName: 'randomPersonalData',
    apiUrl: '/',
    searchedKnownMemberList: [
      { public_name: 'random', username: 'random', user_id: 1 },
      { public_name: 'Searched', username: 'Searched', user_id: 2 },
      { public_name: 'Known', username: 'Known', user_id: 3 },
      { public_name: 'Member', username: 'Member', user_id: 4 },
      { public_name: 'List', username: 'List', user_id: 5 },
      { public_name: 'Test', username: 'Test', user_id: 6 }
    ],
    isEmail: false,
    onClickAutoComplete: onClickAutoCompleteCallBack,
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    canSendInviteNewUser: true,
    emailNotifActivated: true,
    roleList: [{ slug: 'random' }, { slug: 'Role' }],
    autoCompleteClicked: true,
    onClickBtnValidate: onClickBtnValidateCallBack,
    onChangeRole: onChangeRoleCallBack,
    onClickKnownMember: onClickKnownMemberCallBack,
    onChangePersonalData: onChangePersonalDataCallBack,
    autoCompleteActive: true,
    role: 'randomRole'
  }

  const wrapper = mount(<NewMemberForm {...props} />)

  describe('Static design', () => {
    it(`text input should have the value: ${props.publicName}`, () => {
      expect(wrapper.find('#addmember').prop('value')).to.equal(props.publicName)
    })

    it(`should have the submit button disabled property set to ${!props.autoCompleteClicked}`, () => {
      expect(wrapper.find('.memberlist__form__submitbtn > button').prop('disabled'))
        .to.equal(!props.autoCompleteClicked)
    })

    it('should display the 5 first searched known Member of the list', () => {
      expect(wrapper.find('.autocomplete__item').length).equal(5)
      for (let i = 0; i < 5; i++) {
        expect(wrapper.find('div.autocomplete__item__avatar Avatar').at(i).prop('user'))
          .to.deep.equal(props.searchedKnownMemberList[i])
        expect(wrapper.find('div.autocomplete__item__name').at(i))
          .to.have.text().equal(`${props.searchedKnownMemberList[i].public_name}@${props.searchedKnownMemberList[i].username}`)
      }
    })
  })

  describe('Handlers', () => {
    it('should call props.onClickBtnValidate when handler onClickBtnValidate is called at form validation', () => {
      wrapper.find('button').simulate('click')
      expect(onClickBtnValidateCallBack.called).to.equal(true)
    })

    it('should call props.onClickCloseAddMemberBtn when handler onClickCloseAddMemberBtn is called at form closing', () => {
      wrapper.find('.memberlist__form__close').simulate('click')
      expect(onClickCloseAddMemberBtnCallBack.called).to.equal(true)
    })

    it('should call props.onClickKnownMember when handler onClickKnownMember is called', () => {
      wrapper.find('div.autocomplete__item').first().simulate('click')
      expect(onClickKnownMemberCallBack.called).to.equal(true)
    })

    it('should call props.onClickAutoComplete when handler onClickAutoComplete is called', () => {
      wrapper.setProps({ searchedKnownMemberList: [] })
      wrapper.find('div.autocomplete__item').first().simulate('click')
      expect(onClickAutoCompleteCallBack.called).to.equal(true)
      wrapper.setProps({ searchedKnownMemberList: props.searchedKnownMemberList })
    })

    it('should call props.onChangePersonalData when handler onChangePersonalData is called', () => {
      wrapper.find('input.name__input').simulate('change', { target: { value: 'randomValue' } })
      expect(onChangePersonalDataCallBack.called).to.equal(true)
    })
  })
})
