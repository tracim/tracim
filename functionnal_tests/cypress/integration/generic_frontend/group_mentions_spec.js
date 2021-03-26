/*
  FIXME - GB - 2021-03-04 - Unstable test. See https://github.com/tracim/tracim/issues/4239
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
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId: workspaceId, contentType: 'thread', contentId: threadId }
      })
    })

    describe('the group mention (all)', function () {
      it('should be translated in English', function () {
        cy.changeLanguage('en')
        cy.contains('.dropdownlang__dropdown__btnlanguage', 'English')
        cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
          .should('be.visible')
          .type('@')
        cy.get('.autocomplete').should('be.visible')
        cy.contains('.autocomplete__item', '@all')
      })

      it('should be translated in French', function () {
        cy.changeLanguage('fr')
        cy.contains('.dropdownlang__dropdown__btnlanguage', 'Français')
        cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
          .should('be.visible')
          .type('@')
        cy.get('.autocomplete').should('be.visible')
        cy.contains('.autocomplete__item', '@tous')
      })

      it('should be translated in Portuguese', function () {
        cy.changeLanguage('pt')
        cy.contains('.dropdownlang__dropdown__btnlanguage', 'Português')
        cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
          .should('be.visible')
          .type('@')
        cy.contains('.autocomplete__item', '@todos')
      })
    })
})
*/
