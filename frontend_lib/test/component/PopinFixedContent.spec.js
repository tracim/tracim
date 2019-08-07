import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent.jsx'
// import sinon from 'sinon'

describe('<PopinFixedContent />', () => {
  const props = {
    customClass: 'randomCustomClass'
  }

  const Children = () => <div><h1>Random title</h1>I am the first children of PopinFixedContent</div>
  // const Children2 = () => <div><h1>Random title2</h1>I am the second children of PopinFixedContent</div>
  // const Children3 = () => <div><h1>Random title3</h1>I am the third children of PopinFixedContent</div>

  const wrapper = shallow(
    <PopinFixedContent
      {...props}
    >
      <Children />
    </PopinFixedContent>
  )

  describe('Static design', () => {
    it(`the div should have the class : "${(props.customClass)}__content"`, () =>
      expect(wrapper.find(`div.${(props.customClass)}__content.wsContentGeneric__content`)).to.have.lengthOf(1)
    )

    // describe('Console spy', () => {
    //   const sandbox = sinon.sandbox.create()
    //   beforeEach(() => {
    //     sandbox.spy(console, 'error')
    //   })
    //
    //   afterEach(function () {
    //     sandbox.restore()
    //   })
    //
    //   it('passing valid childrens should not return error', () => {
    //     shallow(
    //       <PopinFixedContent
    //         { ...props }
    //       >
    //       </PopinFixedContent>
    //     )
    //     expect(console.error.called).to.equal(true)
    //     sandbox.restore()
    //   })
    //
    //   it('passing forbidden children should return error', () => {
    //     shallow(
    //       <PopinFixedContent { ...props }>
    //         <Children />
    //         <Children2 />
    //         <Children3 />
    //       </PopinFixedContent>
    //     )
    //     expect(console.error.called).to.equal(true)
    //     sandbox.restore()
    //   })
    //
    //   it('passing valid childrens should not return error', () => {
    //     shallow(
    //       <PopinFixedContent { ...props }>
    //         <Children />
    //         <Children2 />
    //       </PopinFixedContent>
    //     )
    //     expect(console.error.called).to.equal(false)
    //   })
    // })
  })
})
