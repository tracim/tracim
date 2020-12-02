import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PageTitle from '../../src/component/Layout/PageTitle.jsx'

describe('<PageTitle />', () => {
  const props = {
    parentClass: 'randomParentClass',
    customClass: 'randomCustomClass',
    title: 'randomTitle',
    subtitle: 'randomSubtitle',
    icon: 'randomIcon',
    breadcrumbsList: ['random', 'breadcrumbs', 'list']
  }

  const Children = () => <div><h1>Random title</h1>I am a children of PageTitle</div>

  const wrapper = shallow(
    <PageTitle
      {...props}
    >
      <Children />
    </PageTitle>
  )

  describe('Static design', () => {
    it('should have its children', () =>
      expect(wrapper.find('.pageTitleGeneric').find(Children).length).equal(1)
    )

    it(`3 div should have the class: "${props.parentClass}"`, () => {
      expect(wrapper.find(`div.${props.parentClass}.pageTitleGeneric`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.parentClass}__title.pageTitleGeneric__title`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.parentClass}__subtitle.pageTitleGeneric__subtitle`)).to.have.lengthOf(1)
    })

    it(`the div should have the class: "${props.customClass}"`, () =>
      expect(wrapper.find(`div.${(props.customClass)}.pageTitleGeneric`)).to.have.lengthOf(1)
    )

    it(`should have the icon: "${props.icon}"`, () => {
      expect(wrapper.find(`i.fa.fa-fw.fa-${props.icon}`)).to.have.lengthOf(1)
    })

    it(`should display the title: "${props.title}"`, () => {
      expect(wrapper.find('div.pageTitleGeneric__title__label')).to.have.text().equal(props.title)
    })

    it(`should display the title: "${props.subtitle}"`, () => {
      expect(wrapper.find(`div.${props.parentClass}__subtitle`)).to.have.text().equal(props.subtitle)
    })
  })
})
