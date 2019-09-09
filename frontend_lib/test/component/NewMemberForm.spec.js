import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import NewMemberForm from '../../src/component/NewMemberForm/NewMemberForm.jsx'
import { ROLE_OBJECT } from '../../src/helper.js'
require('../../src/component/NewMemberForm/NewMemberForm.styl')

describe('<NewMemberForm />', () => {
  const onClickCloseAddMemberBtnCallBack = sinon.stub()
  const onClickAutoCompleteCallBack = sinon.stub()
  const onClickBtnValidateCallBack = sinon.stub()
  const onChangeRoleCallBack = sinon.stub()
  const onClickKnownMemberCallBack = sinon.stub()
  const onChangeNameOrEmailCallBack = sinon.stub()

  const props = {
    onClickCloseAddMemberBtn: onClickCloseAddMemberBtnCallBack,
    nameOrEmail: 'randomNameOrEmail',
    searchedKnownMemberList: [
      { public_name: 'random', user_id: 1 },
      { public_name: 'Searched', user_id: 2 },
      { public_name: 'Known', user_id: 3 },
      { public_name: 'Member', user_id: 4 },
      { public_name: 'List', user_id: 5 },
      { public_name: 'Test', user_id: 6 }
    ],
    isEmail: false,
    onClickAutoComplete: onClickAutoCompleteCallBack,
    userRoleIdInWorkspace: ROLE_OBJECT.workspaceManager.id,
    canSendInviteNewUser: true,
    emailNotifActivated: true,
    roleList: [{ slug: 'random' }, { slug: 'Role' }],
    autoCompleteClicked: true,
    onClickBtnValidate: onClickBtnValidateCallBack,
    onChangeRole: onChangeRoleCallBack,
    onClickKnownMember: onClickKnownMemberCallBack,
    onChangeNameOrEmail: onChangeNameOrEmailCallBack,
    autoCompleteActive: true,
    role: 'randomRole'
  }

  const wrapper = mount(
    <NewMemberForm
      {...props}
    />
  )

  describe('Static design', () => {
    it(`text input should have the value: ${props.nameOrEmail}`, () => {
      expect(wrapper.find('#addmember').prop('value')).to.equal(props.nameOrEmail)
    })

    it(`should display ${props.roleList.length} roles`, () => {
      expect(wrapper.find('.memberlist__form__role__list__item').length).equal(props.roleList.length)
      for (let i = 0; i < props.roleList.length; i++) {
        expect(wrapper.find(`[value='${props.roleList[i].slug}']`).length)
          .to.equal(1)
        expect(wrapper.find(`[value='${props.roleList[i].slug}']`).prop('checked'))
          .to.equal(props.roleList[i].slug === props.role)
      }
    })

    it(`should have the submit button disabled property set to ${!props.autoCompleteClicked}`, () => {
      expect(wrapper.find('.memberlist__form__submitbtn > button').prop('disabled'))
        .to.equal(!props.autoCompleteClicked)
    })

    it(`should display the 5 first searched known Member of the list`, () => {
      expect(wrapper.find('.autocomplete__item').length).equal(5)
      for (let i = 0; i < 5; i++) {
        expect(wrapper.find('div.autocomplete__item__avatar > Avatar').at(i).prop('publicName'))
          .to.equal(props.searchedKnownMemberList[i].public_name)
        expect(wrapper.find('div.autocomplete__item__name').at(i))
          .to.have.text().equal(props.searchedKnownMemberList[i].public_name)
      }
    })
  })

  describe('Handlers', () => {
    it('should call props.onClickBtnValidate when handler onClickBtnValidate is called at form validation', () => {
      wrapper.find(`button`).simulate('click')
      expect(onClickBtnValidateCallBack.called).to.equal(true)
    })

    it('should call props.onClickCloseAddMemberBtn when handler onClickCloseAddMemberBtn is called at form closing', () => {
      wrapper.find(`.memberlist__form__close`).simulate('click')
      expect(onClickCloseAddMemberBtnCallBack.called).to.equal(true)
    })

    it('should call props.onClickKnownMember when handler onClickKnownMember is called', () => {
      wrapper.find(`div.autocomplete__item.primaryColorBgHover`).first().simulate('click')
      expect(onClickKnownMemberCallBack.called).to.equal(true)
    })

    it('should call props.onClickAutoComplete when handler onClickAutoComplete is called', () => {
      wrapper.setProps({ searchedKnownMemberList: [] })
      wrapper.find(`div.autocomplete__item.primaryColorBgHover`).first().simulate('click')
      expect(onClickAutoCompleteCallBack.called).to.equal(true)
      wrapper.setProps({ searchedKnownMemberList: props.searchedKnownMemberList })
    })

    it('should call props.onChangeRole when handler onChangeRole is called', () => {
      wrapper.find(`.item__radiobtn > input`).first().simulate('change')
      expect(onChangeRoleCallBack.called).to.equal(true)
    })

    it('should call props.onChangeNameOrEmail when handler onChangeNameOrEmail is called', () => {
      wrapper.find(`input.name__input`).simulate('change', { target: { value: 'randomValue' } })
      expect(onChangeNameOrEmailCallBack.called).to.equal(true)
    })
  })
})
