import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('TinyMce text editor', function () {
  const fileName = 'testFile'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  describe.skip('Click to add an Image to the html document created', function () {
    before(() => {
      cy.loginAs('users')
      cy.createHtmlDocument(fileName, 1)
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
    })

    it('The input tag should not be visible', function () {
      this.skip() // FIXME MB - 2021-10-21 - Unstable test
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName } }).click()
      cy.waitForTinyMCELoaded().then(() => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .find('.mce-i-image')
          .parent()
          .click()
        cy.get('#hidden_tinymce_fileinput').should('be.not.visible')
      })
    })
  })

  describe.skip('Mention autoCompletion', function () {
    describe('Insert a new mention', function () {
      beforeEach(() => {
        cy.loginAs('users')
        cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName } }).click()
      })

      it('the autocompletion popup should open when typing "@"', function () {
        this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@')
          cy.get('.autocomplete').should('be.visible')
        })
      })

      it('the autocompletion should find @johndoe when typing it', function () {
        this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe')
        })
      })

      it('the autocompletion should find @johndoe when typing it, even with a space', function () {
        this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE(' ')
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe')
        })
      })

      it('the autocompletion should add the item submitted', function () {
        this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe').click()
          cy.assertTinyMCEContent('@johndoe')
        })
      })

      it('the autocompletion should be cancel after press the space bar', function () {
      this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE(' ')
          cy.inputInTinyMCE('@')
          cy.get('.autocomplete').should('be.visible')
          cy.inputInTinyMCE(' ')
          cy.get('.autocomplete').should('be.not.visible')
        })
      })

      it('the autocompletion should handle 2 mentions inserted with the autocomplete popup', function () {
      this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE(' ')
          cy.inputInTinyMCE('@jo')
          cy.get('.autocomplete').should('be.visible')
          cy.inputInTinyMCE(' ')
          cy.get('.autocomplete').should('be.not.visible')
          cy.inputInTinyMCE(' ')
          cy.inputInTinyMCE('@john')
          cy.contains('.autocomplete', '@johndoe').click()
          cy.assertTinyMCEContent('<p>@jo&nbsp;&nbsp;@johndoe&nbsp;</p>')
        })
      })

      it('should not leave any span after saving the content', function () {
      this.skip() // FIXME MB - 2021-10-21 - Unstable test
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@johndoe')
          cy.get('.html-document__editionmode__submit').click()
          cy.get('#autocomplete').should('be.not.visible')
        })
      })
    })
  })
  describe('List direction', () => {
    before(() => {
      cy.loginAs('users')
      cy.createHtmlDocument(fileName, 1, null, 'Foobar')
    })
    beforeEach(() => {
      cy.loginAs('users')
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
      cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName } }).click()
    })
    for (const [buttonTitle, domElement] of [['Bullet list', 'ul'], ["Numbered list", 'ol']]) {
      it(`should setup a dir="auto" attribute on ${buttonTitle}s`, function () {
        cy.get('[data-cy=newVersionButton]').click()
        cy.getActiveTinyMCEEditor()
          .then(editor => {
            editor.setContent('Hello')
          })
        cy.get(`[title="${buttonTitle}"]`).click()
        cy.get('[data-cy=editionmode__button__submit]').click()
        cy.get(`.html-content > ${domElement}`).invoke('attr', 'dir').should('be.equal', 'auto')
      })
    }
  })
})
