import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { MenuProfile as MenuProfileWithoutHOC } from '../../../src/component/Header/MenuActionListItem/MenuProfile.jsx'
import sinon from 'sinon'

describe('<MenuProfile />', () => {
  const onClickLogoutCallBack = sinon.spy()

  const props = {
    user: {
      publicName: 'randomPublicName',
      logged: true
    },
    onClickLogout: onClickLogoutCallBack
  }

  const wrapper = shallow(<MenuProfileWithoutHOC {...props} t={key => key} />)

  describe('handler', () => {
    it('onClickLogoutCallBack should be called when logout div is clicked', () => {
      wrapper.find('button.transparentButton').simulate('click')
      expect(onClickLogoutCallBack.called).to.equal(true)
    })
  })
})
