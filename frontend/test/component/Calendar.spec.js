import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Calendar as CalendarWithoutHOC } from '../../src/component/Account/Calendar.jsx'
import { translateMock } from '../hocMock/translate'

describe('<Calendar />', () => {
  const props = {
    user: {
      caldavUrl: 'randomCaldavUrl'
    }
  }

  const ComponentWithHoc = translateMock()(CalendarWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static intern', () => {
    it('should display the caldavUrl of the user in a div', () =>
      expect(wrapper.find('div.calendar__link')).to.text().equal(props.user.caldavUrl)
    )
  })
})
