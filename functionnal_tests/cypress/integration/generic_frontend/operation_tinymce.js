import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('TinyMce text editor', function () {
  const fileName = 'testFile'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.createHtmlDocument(fileName, 1)
  })

  describe('Click to add an Image to the html document created', function () {
    before(() => {
      cy.loginAs('users')
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
    })

    it('The input tag should not be visible', function () {
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

  describe('Mention autoCompletion', function () {
    describe('Insert a new mention', function () {
      beforeEach(() => {
        cy.loginAs('users')
        cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: 1 } })
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName } }).click()
      })

      it('the autocompletion popup should open when typing "@"', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@')
          cy.get('.autocomplete').should('be.visible')
        })
      })

      it('the autocompletion should find @johndoe when typing it', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe')
        })
      })

      it('the autocompletion should find @johndoe when typing it, even with a space', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE(' ')
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe')
        })
      })

      it('the autocompletion should add the item submitted', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe').click()
          cy.assertTinyMCEContent('@johndoe')
        })
      })

      it('the autocompletion should be cancel after press the space bar', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@')
          cy.get('.autocomplete').should('be.visible')
          cy.inputInTinyMCE(' ')
          cy.get('.autocomplete').should('be.not.visible')
        })
      })

      it('the autocompletion should handle 2 mentions inserted with the autocomplete popup', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@jo')
          cy.get('.autocomplete').should('be.visible')
          cy.inputInTinyMCE(' ')
          cy.get('.autocomplete').should('be.not.visible')
          cy.inputInTinyMCE('@john')
          cy.get('.autocomplete').contains('@johndoe').click()
          cy.assertTinyMCEContent('<p>@jo&nbsp;@johndoe&nbsp;</p>')
        })
      })

      it('should not leave any span after saving the content', function () {
        cy.waitForTinyMCELoaded().then(() => {
          cy.inputInTinyMCE('@johndoe')
          cy.get('.html-document__editionmode__submit').click()
          cy.get('#autocomplete').should('be.not.visible')
        })
      })
    })
  })
})
