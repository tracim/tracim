import { PAGES } from '../../support/urls_commands'

const threadTitle = 'Title'
let threadId
let workspaceId

describe('At the autocompletion popup', function () {
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
    cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
  })

  describe('the group mention (all)', function () {
    it('should be translated in English', function () {
      cy.get('.commentArea__advancedtext__btn').should('be.visible')
      cy.changeLanguage('en')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
      cy.contains('.commentArea__advancedtext__btn', 'Advanced edition')
      cy.get('.commentArea__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(' @')
      cy.get('.autocomplete').should('be.visible')
      cy.contains('.autocomplete__item', '@all')
    })

    it('should be translated in French', function () {
      cy.get('.commentArea__advancedtext__btn').should('be.visible')
      cy.changeLanguage('fr')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
      cy.contains('.commentArea__advancedtext__btn', 'Édition avancée')
      cy.get('.commentArea__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(' @')
      cy.get('.autocomplete').should('be.visible')
      cy.contains('.autocomplete__item', '@tous')
    })

    it('should be translated in Portuguese', function () {
      cy.get('.commentArea__advancedtext__btn').should('be.visible')
      cy.changeLanguage('pt')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId: threadId } })
      cy.contains('.commentArea__advancedtext__btn', 'Edição avançada')
      cy.get('.commentArea__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(' @')
      cy.contains('.autocomplete__item', '@todos')
    })
  })
})
