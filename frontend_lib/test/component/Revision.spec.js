import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import Revision from '../../src/component/Timeline/Revision.jsx'
import sinon from 'sinon'

describe('<Revision />', () => {
  const onClickRevisionCallBack = sinon.spy()

  const props = {
    customClass: 'randomCustomClass',
    allowClickOnRevision: false,
    number: 0,
    authorPublicName: 'randomAuthorPublicName',
    status: 'randomStatus',
    createdFormated: 'randomCreatedFormated',
    createdDistance: 'randomCreatedDistance',
    revisionType: 'revision',
    onClickRevision: onClickRevisionCallBack
  }

  const wrapper = mount(
    <Revision {...props} />
  )

  describe('Static design', () => {
    it(`should have the class '${props.customClass}__messagelist__version'`, () => {
      expect(wrapper.find(`div.${props.customClass}__messagelist__version`)).to.have.lengthOf(1)
    })

    it(`the span ".revision__data__nb" should contains "${props.number}"`, () => {
      expect(wrapper.find('span.revision__data__nb')).to.have.text().contains(props.number)
    })

    it(`the span ".revision__data__infos__created" should contains "${props.createdDistance}"`, () => {
      expect(wrapper.find('span.revision__data__infos__created')).to.have.text().contains(props.createdDistance)
    })
  })

  describe('Handlers', () => {
    it('should call onClickRevision when click and when allowClickOnRevision', () => {
      wrapper.setProps({ allowClickOnRevision: true })
      wrapper.find(`div.${props.customClass}__messagelist__version`).simulate('click')
      expect(onClickRevisionCallBack.called).to.equal(true)
      onClickRevisionCallBack.resetHistory()
      wrapper.setProps({ allowClickOnRevision: props.allowClickOnRevision })
      wrapper.find(`div.${props.customClass}__messagelist__version`).simulate('click')
      expect(onClickRevisionCallBack.called).to.equal(false)
    })
  })
})
