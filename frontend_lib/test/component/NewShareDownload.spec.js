import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { NewShareDownload } from '../../src/component/ShareDownload/NewShareDownload.jsx'
require('../../src/component/ShareDownload/ShareDownload.styl')

describe('<NewShareDownload />', () => {
  const onChangeEmailsCallBack = sinon.stub()
  const onKeyDownEnterCallBack = sinon.stub()
  const onChangePasswordCallBack = sinon.stub()
  const onClickCancelButtonCallBack = sinon.stub()
  const onClickNewShareCallBack = sinon.stub()

  const props = {
    shareEmails: 'randomEmail@randomEmail.randomEmail',
    onChangeEmails: onChangeEmailsCallBack,
    onKeyDownEnter: onKeyDownEnterCallBack,
    hexcolor: 'yellow',
    sharePassword: 'randomPassword',
    onChangePassword: onChangePasswordCallBack,
    onClickCancelButton: onClickCancelButtonCallBack,
    onClickNewShare: onClickNewShareCallBack,
    emailNotifActivated: false
  }

  const wrapper = shallow(
    <NewShareDownload
      {...props}
      t={key => key}
    />
  )

  describe('Static design', () => {
    it(`emails input should have the value: ${props.shareEmails}`, () => {
      expect(wrapper.find('.shareDownload__email__input').prop('value')).to.equal(props.shareEmails)
    })

    it(`password input should have the value: ${props.sharePassword}`, () => {
      wrapper.find('.shareDownload__password__link').simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(wrapper.find('.shareDownload__password__input').prop('value')).to.equal(props.sharePassword)
    })
  })

  describe('Handlers', () => {
    it('onChangeEmails handler should call the proper handler', () => {
      wrapper.find('.shareDownload__email__input').simulate('change', { target: { value: 'anotherEmail' } })
      expect(onChangeEmailsCallBack.called).to.equal(true)
    })

    it('onKeyDownEnter handler should call the proper handler', () => {
      wrapper.find('.shareDownload__email__input').simulate('keyDown', { key: 'Enter', preventDefault: () => {} })
      expect(onKeyDownEnterCallBack.called).to.equal(true)
    })

    it('onChangePassword handler should call the proper handler', () => {
      wrapper.find('.shareDownload__password__input').simulate('change', { target: { value: 'anotherEmail' } })
      expect(onChangePasswordCallBack.called).to.equal(true)
    })

    it('onClickCancelButton handler should call the proper handler', () => {
      wrapper.find('.shareDownload__cancel').simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onClickCancelButtonCallBack.called).to.equal(true)
    })

    it('onClickNewShare handler should call the proper handler', () => {
      wrapper.find('.shareDownload__newBtn').simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onClickNewShareCallBack.called).to.equal(true)
    })
  })
})
