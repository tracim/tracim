import {create_file} from '../helpers/file.js'
import {create_thread} from '../helpers/thread.js'

describe('Switch from app File to app Thread', () => {
  const fileTitle = 'FileForSwitch'
  const threadTitle = 'ThreadForSwitch'
  const contentThreadGetter = `.workspace__content__fileandfolder > .content[title="${threadTitle}"]`
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

      create_thread(cy, threadTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  it('should close the app File and open the app Thread', () => {
    cy.visit(`/ui/workspaces/${workspaceId}/contents`, {retryOnStatusCodeFailure: true})

    cy.get(contentFileGetter).click('left')
    cy.get(contentThreadGetter).click('left')

    cy.get('[data-cy="popinFixed"].file').should('be.not.visible')
    cy.get('[data-cy="popinFixed"].thread').should('be.visible')
  })
})
