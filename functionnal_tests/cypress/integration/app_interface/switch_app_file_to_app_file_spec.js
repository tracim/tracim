import {create_file} from '../helpers/file.js'

describe('Switch from app File to app File', () => {
  const fileTitle = 'FileForSwitch'
  const contentFileGetter = `.workspace__content__fileandfolder > .content[title="${fileTitle}"]`
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visit(`/ui/workspaces/${workspaceId}/contents`)

      create_file(cy, fileTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  it("should hide the app File and set it visible back", () => {
    cy.visit(`/ui/workspaces/${workspaceId}/contents`, {retryOnStatusCodeFailure: true})

    cy.get(contentFileGetter).click('left')

    cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    cy.get('[data-cy="popinFixed"].file').should('be.not.visible')

    cy.get(contentFileGetter).click('left')
    cy.get('[data-cy="popinFixed"].file').should('be.visible')
  })
})
