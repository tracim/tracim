import {create_thread} from '../helpers/thread.js'

describe('Switch from app File to app File', () => {
  const threadTitle = 'ThreadForSwitch'
  const contentThreadGetter = `.workspace__content__fileandfolder > .content[title="${threadTitle}"]`
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visit(`/ui/workspaces/${workspaceId}/contents`)

      create_thread(cy, threadTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  it('should hide the app Thread and set it visible back', () => {
    cy.visit(`/ui/workspaces/${workspaceId}/contents`, {retryOnStatusCodeFailure: true})

    cy.get(contentThreadGetter).click('left')

    cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    cy.get('[data-cy="popinFixed"].thread').should('be.not.visible')

    cy.get(contentThreadGetter).click('left')
    cy.get('[data-cy="popinFixed"].thread').should('be.visible')
  })
})
