import { expect } from 'chai'
import { PAGES } from '../../support/urls_commands'

const invalidMention = '@invalidMention'
const commentContent = `An ${invalidMention}`
const noteTitle = 'Title'

let noteId
let spaceId

describe('In a note', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      spaceId = workspace.workspace_id
      cy.createHtmlDocument(noteTitle, spaceId)
        .then(note => {
          noteId = note.content_id
          cy.updateHtmlDocument(noteId, spaceId, 'SomeContent', noteTitle)
        })
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: noteId }
    })
    cy.get('.html-document__contentpage__timeline__texteditor > .tox-tinymce')
      .click()
    cy.getActiveHugeRTEEditor()
      .then(editor => {
        editor.setContent(commentContent)
        cy.get('.commentArea__submit__btn')
          .click()
      })
  })

  describe('an invalid mention in the comment area', () => {
    it('should open a popup that contains this mention', () => {
      cy.contains('.commentArea__mentions', invalidMention)
    })

    it('should remain in edition mode if user clicks on "Edit" in the popup', () => {
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()

      cy.getActiveHugeRTEEditor()
        .then(editor => {
          expect(editor.getContent()).to.include(commentContent)
        })
    })

    it('should save the document if user clicks at "Validate anyway" in the popup', () => {
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__comment__body__content__text', commentContent)
    })
  })
})
