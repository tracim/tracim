import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('HugeRte text editor', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  describe.skip('Click to add an Image to the html document created', function () {
    const fileName = 'TestNote1'
    before(() => {
      cy.loginAs('users')
      cy.createHtmlDocument(fileName, 1)
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
    })

    it('The input tag should not be visible', function () {
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName } }).click()
      cy.waitForHugeRTELoaded().then(() => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .find('.mce-i-image')
          .parent()
          .click()
        cy.get('#hidden_tinymce_fileinput').should('not.exist')
      })
    })
  })

  // INFO - CH - 2025-01-06 - Skipping test because unstable. The page contains 2 tinymce editors:
  // The note and the comment. The current process doesn't always select the right one depending on
  // which is loaded first
  describe.skip('Mention autoCompletion', function () {
    describe('Insert a new mention', function () {
      before(() => {
        cy.loginAs('users')
        cy.createHtmlDocument('TestNote2', 1)
      })

      beforeEach(() => {
        cy.loginAs('users')
        cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: 'TestNote2' } }).click()
      })

      it('the autocompletion popup should open when typing "@"', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE('@')
          cy.get('.tox-menu').should('be.visible')
        })
      })

      it('the autocompletion should find @johndoe when typing it', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE('@john')
          cy.get('.tox-menu').contains('@johndoe')
        })
      })

      it('the autocompletion should find @johndoe when typing it, even with a space', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE(' ')
          cy.inputInHugeRTE('@john')
          cy.get('.tox-menu').contains('@johndoe')
        })
      })

      it('the autocompletion should add the item submitted', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE('@john')
          cy.get('.tox-menu').contains('@johndoe').click()
          cy.assertHugeRTEContent('@johndoe')
        })
      })

      it('the autocompletion should be cancel after press the space bar', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE(' ')
          cy.inputInHugeRTE('@')
          cy.get('.tox-menu').should('be.visible')
          cy.inputInHugeRTE(' ')
          cy.get('.tox-menu').should('not.exist')
        })
      })

      it('the autocompletion should handle 2 mentions inserted with the autocomplete popup', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE(' ')
          cy.inputInHugeRTE('@jo')
          cy.get('.tox-menu').should('be.visible')
          cy.inputInHugeRTE(' ')
          cy.get('.tox-menu').should('not.exist')
          cy.inputInHugeRTE(' ')
          cy.inputInHugeRTE('@john')
          cy.contains('.autocomplete', '@johndoe').click()
          cy.assertHugeRTEContent('<p>@jo&nbsp;&nbsp;@johndoe&nbsp;</p>')
        })
      })

      it('should not leave any span after saving the content', function () {
        cy.waitForHugeRTELoaded().then(() => {
          cy.inputInHugeRTE('@johndoe')
          cy.get('.html-document__editionmode__submit').click()
          cy.get('#autocomplete').should('not.exist')
        })
      })
    })
  })

  describe('List direction', () => {
    before(() => {
      cy.loginAs('users')
      cy.createHtmlDocument('TestNote3', 1, null, 'Foobar')
    })
    beforeEach(() => {
      cy.loginAs('users')
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: 'TestNote3' } }).click()
    })
    for (const [buttonTitle, domElement] of [['Bullet list', 'ul'], ["Numbered list", 'ol']]) {
      it(`should setup a dir="auto" attribute on ${buttonTitle}s`, function () {
        cy.get('[data-cy=newVersionButton]').click()
        cy.getActiveHugeRTEEditor()
          .then(editor => {
            editor.setContent('Hello')
          })
        cy.get('[aria-label="Reveal or hide additional toolbar items"]').eq(0).click()
        cy.get(`.tox-hugerte-aux [aria-label="${buttonTitle}"]`).click()
        cy.get('[data-cy=editionmode__button__submit]').click()
        cy.get(`.HTMLContent > ${domElement}`).invoke('attr', 'dir').should('be.equal', 'auto')
      })
    }
  })
})
