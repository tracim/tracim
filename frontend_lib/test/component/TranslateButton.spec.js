import { React } from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { TranslateButton } from '../../src/component/Button/TranslateButton.jsx'
import { TRANSLATION_STATE } from '../../src/helper.js'

const props = {
  translationState: TRANSLATION_STATE.DISABLED,
  onClickToggleTranslation: () => {}
}

describe('<TranslateButton />', () => {
  describe('translationState', () => {
    const testCases = [
      {
        description: 'with translation disabled',
        state: TRANSLATION_STATE.DISABLED,
        containedText: '',
        expectation: 'should not contain anything'
      },
      {
        description: 'with translation enabled',
        state: TRANSLATION_STATE.ENABLED,
        containedText: 'Show translation',
        expectation: 'should contain show translation'
      },
      {
        description: 'with translation disabled',
        state: TRANSLATION_STATE.PENDING,
        containedText: 'Translation pending',
        expectation: 'should contain the pending text'
      },
      {
        description: 'with translation done',
        state: TRANSLATION_STATE.TRANSLATED,
        containedText: 'Restore original language',
        expectation: 'should contain restore translation'
      }
    ]
    for (const testCase of testCases) {
      const wrapper = mount(
        <TranslateButton
          {...props}
          translationState={testCase.state}
        />
      )
      describe(testCase.description, () => {
        it(testCase.expectation, () =>
          expect(wrapper.render().text()).to.contains(testCase.containedText)
        )
      })
    }
  })
})
