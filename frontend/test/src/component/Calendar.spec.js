import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Calendar as CalendarWithoutHOC } from '../../../src/component/Account/Calendar.jsx'

describe('<Calendar />', () => {
  const props = {
    user: {
      caldavUrl: 'randomCaldavUrl'
    }
  }

  const wrapper = shallow(<CalendarWithoutHOC {...props} t={key => key} />)

  describe('static intern', () => {
    it('should display the caldavUrl of the user in a div', () =>
      expect(wrapper.find('div.calendar__link')).to.text().equal(props.user.caldavUrl)
    )
  })
})
