import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import MainPreview from '../../src/component/MainPreview'
import sinon from 'sinon'

describe('<MainPreview />', () => {
  const props = {

  }

  const wrapper = shallow(<MainPreview {...props} t={tradKey => tradKey} />)

  describe('static design', () => {

  })
})
