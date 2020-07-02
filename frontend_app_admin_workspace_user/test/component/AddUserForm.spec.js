import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { AddUserForm } from '../../src/component/AddUserForm.jsx'
import sinon from 'sinon'

describe('<AddUserForm />', () => {

  const props = {

  }

  const wrapper = shallow(<AddUserForm {...props} t={tradKey => tradKey} />)

  describe('its internal functions', () => {
    it('', () => {

    })
  })
})
