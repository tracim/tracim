import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { MenuProfil as MenuProfilWithoutHOC } from '../../../src/component/Header/MenuActionListItem/MenuProfil.jsx'
import sinon from 'sinon'

describe('<MenuProfil />', () => {
  const onClickLogoutCallBack = sinon.spy()

  const props = {
    user: {
      publicName: 'randomPublicName',
      logged: true
    },
    onClickLogout: onClickLogoutCallBack
  }

  const wrapper = shallow(<MenuProfilWithoutHOC {...props} t={key => key} />)

  describe('handler', () => {
    it('onClickLogoutCallBack should be called when logout div is clicked', () => {
      wrapper.find('button.transparentButton').simulate('click')
      expect(onClickLogoutCallBack.called).to.equal(true)
    })
  })
})
