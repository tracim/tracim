import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import PopinFixed from '../../src/component/PopinFixed/PopinFixed'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent'
import PopinFixedHeader from '../../src/component/PopinFixed/PopinFixedHeader'
import PopinFixedOption from '../../src/component/PopinFixed/PopinFixedOption'
require('../../src/component/PopinFixed/PopinFixed.styl')

describe('<PopinFixed />', () => {
  const props = {
    customClass: 'randomCustomClass',
    visible: false,
    style: {
      color: 'yellow'
    }
  }

  const wrapper = shallow(
    <PopinFixed
      { ...props }
    >
      <PopinFixedHeader />
      <PopinFixedOption />
      <PopinFixedContent />
    </PopinFixed>
  )

  describe('Static design', () => {
    it(`should have the class visible when props.visible is set to true`, () => {
      expect(wrapper.find(`div.${props.customClass}.visible`).length).to.equal(0)
      wrapper.setProps({visible: true})
      expect(wrapper.find(`div.${props.customClass}.visible`).length).to.equal(1)
      wrapper.setProps({visible: props.visible})
    })

    it(`div should have the proper style`, () => {
      expect(wrapper.find(`div.${props.customClass}`).prop('style')).to.eql(props.style)
    })
    describe('Console spy', () => {
      const sandbox = sinon.sandbox.create()
      beforeEach(() => {
        sandbox.spy(console, 'error')
      })

      afterEach(function() {
        sandbox.restore()
      })

      it('passing forbidden children should return error', () => {
        shallow(
          <PopinFixed
            { ...props }>
            <div></div>
          </PopinFixed>
        )
        expect(console.error.called).to.true
        sandbox.restore()
      })

      it('passing valid childrens should not return error', () => {
        shallow(
          <PopinFixed
            { ...props }>
            <PopinFixedHeader />
            <PopinFixedOption />
            <PopinFixedContent />
          </PopinFixed>
        )
        expect(console.error.called).to.not.true
      })
    })
  })
})
