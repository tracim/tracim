import { expect } from 'chai'
import { PAGES } from '../../support/urls_commands'

const invalidMention = '@invalidMention'
const commentContent = `An ${invalidMention}`
const threadTitle = 'Title'

let threadId
let workspaceId

describe('In a thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createThread(threadTitle, workspaceId).then(note => threadId = note.content_id)
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: threadId }
    })
    cy.getActiveTinyMCEEditor()
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

      cy.getActiveTinyMCEEditor()
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
