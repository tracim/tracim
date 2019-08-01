import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import sinon from 'sinon'
import NewMemberForm from '../../src/component/NewMemberForm/NewMemberForm.jsx'
import PageTitle from "../../src/component/Layout/PageTitle";
require('../../src/component/NewMemberForm/NewMemberForm.styl')

describe('<NewMemberForm />', () => {
  const onClickCloseAddMemberBtnCallBack = sinon.stub()
  const onClickAutoCompleteCallBack = sinon.stub()
  const onClickBtnValidateCallBack = sinon.stub()
  const onChangeRoleCallBack = sinon.stub()
  const onClickKnownMemberCallBack = sinon.stub()

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
    userRoleIdInWorkspace: 8,
    canSendInviteNewUser: true,
    emailNotifActivated: true,
    roleList: [ {slug: 'randomRole'}],
    autoCompleteClicked: true,
    onClickBtnValidate: onClickBtnValidateCallBack,
    onChangeRole: onChangeRoleCallBack,
    onClickKnownMember: onClickKnownMemberCallBack,
    autoCompleteActive: true,
    role: 'randomRole'
  }

  const Children = () => <div><h1>Random title</h1>I am a children of ListItemWrapper</div>

  const wrapper = shallow(
    <NewMemberForm
      { ...props }
    />
  ).dive()

  describe('Static design', () => {
    it(`text input should have the value : ${props.nameOrEmail}`, () => {
      expect(wrapper.find('#addmember').prop('value')).to.equal(props.nameOrEmail)
    })

    it(`should display the 5 first searched known Member of the list`, () => {
      expect(wrapper.find('.autocomplete__item').length).equal(5)
      for(let i = 0; i < 5; i++) {
        expect(wrapper.find('div.autocomplete__item__avatar > Avatar').at(i).prop('publicName')).to.equal(props.searchedKnownMemberList[i].public_name)
        expect(wrapper.find('div.autocomplete__item__name').at(i)).to.have.text().equal(props.searchedKnownMemberList[i].public_name)
      }
    })
  })

  describe('Handlers', () => {
    it(`onClick handler should call the proper handler when validate form`, () => {
      wrapper.find(`button`).simulate('click')
      expect(onClickBtnValidateCallBack.called).to.true
    })

    it(`onClose handler should call the proper handler when closing the form`, () => {
      wrapper.find(`.memberlist__form__close`).simulate('click')
      expect(onClickCloseAddMemberBtnCallBack.called).to.true
    })

    it(`onClickKnownMember handler should call the proper handler`, () => {
      wrapper.find(`div.autocomplete__item.primaryColorBgHover`).at(0).simulate('click')
      expect(onClickKnownMemberCallBack.called).to.true
    })

    it(`onClickAutoComplete handler should call the proper handler`, () => {
      wrapper.setProps({searchedKnownMemberList: []})
      wrapper.find(`div.autocomplete__item.primaryColorBgHover`).at(0).simulate('click')
      expect(onClickAutoCompleteCallBack.called).to.true
      wrapper.setProps({searchedKnownMemberList: props.searchedKnownMemberList})
    })

    it(`onClickAutoComplete handler should call the proper handler`, () => {
      wrapper.find(`.item__radiobtn > input`).simulate('change')
      expect(onChangeRoleCallBack.called).to.true
    })
  })
})
