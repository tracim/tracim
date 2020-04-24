import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { MenuProfil as MenuProfilWithoutHOC } from '../../../src/component/Header/MenuActionListItem/MenuProfil.jsx'
import sinon from 'sinon'

describe('<MenuProfil />', () => {
  const onClickLogoutCallBack = sinon.spy()

  const props = {
    user: {
      public_name: 'randomPublicName',
      logged: true
    },
    onClickLogout: onClickLogoutCallBack
  }

  const wrapper = shallow(<MenuProfilWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('should display the public name in a div', () =>
      expect(wrapper.find('div.menuprofil__dropdown__name__text')).to.text().equal(props.user.public_name)
    )
  })

  describe('handler', () => {
    it('onClickLogoutCallBack should be called when logout div is clicked', () => {
      wrapper.find('div.menuprofil__dropdown__setting__link').simulate('click')
      expect(onClickLogoutCallBack.called).to.equal(true)
    })
  })
})
