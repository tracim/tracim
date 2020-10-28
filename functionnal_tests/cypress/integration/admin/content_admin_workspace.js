import { PAGES } from '../../support/urls_commands'

describe('content :: admin > workspace', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.ADMIN_WORKSPACE })
  })

  it('checks the visibility of crucial elements', function () {
    cy.get('.adminWorkspace__description').should('be.visible')
    cy.get('.adminWorkspace__delimiter').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable').should('be.visible')
  })

  it('checks the columns of the space table', function () {
    cy.get('.adminWorkspace__workspaceTable .table__id').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable .table__sharedSpace').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable .table__description').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable .table__memberCount').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable .table__delete').should('be.visible')
  })

  it('checks the delete space button', function () {
    cy.get('.adminWorkspace__workspaceTable tbody tr:first .adminWorkspace__table__delete__icon').click()

    // Cancel
    cy.get('.confirm_popup').should('be.visible')
    cy.get('[data-cy=confirm_popup__button_cancel]').click()
    cy.contains('.adminWorkspace__workspaceTable tbody tr:first td:nth-child(2)', 'My space')

    // Delete
    cy.get('.adminWorkspace__workspaceTable tbody tr:first .adminWorkspace__table__delete__icon').click()
    cy.get('[data-cy=confirm_popup__button_confirm]').click()
    cy.contains('.adminWorkspace__workspaceTable tbody tr:first td:nth-child(2)', 'There is no space yet')
  })

  it('checks the create space button', function () {
    cy.get('.adminWorkspace__btnnewworkspace__btn').click()

    cy.get('.newSpace__input').click().type('A test space')
    cy.get('.singleChoiceList__item__text__content__description').first().click()
    cy.get('.newSpace__button .btn').click()

    cy.get('div.newSpace__input').should('be.visible')
    cy.get('.singleChoiceList__item__text__icon').first().should('be.visible').click()
    cy.contains('.newSpace__button .btn', 'Create').should('not.be.disabled').click()

    cy.location('pathname').should('be.equal', '/ui/workspaces/2/dashboard')
  })
  it('checks space modified TLM', function () {
    cy.request('PUT', 'api/workspaces/1', { label: 'Modified space', description: ''})
    cy.contains('.adminWorkspace__workspaceTable tbody tr:first td:nth-child(2)', 'Modified s')
  })

  it('checks space added and deleted TLM', function () {
    cy.request(
      'POST',
      'api/workspaces',
      { label: 'A new space', description: '', access_type: 'confidential', default_user_role: 'reader' }
    )
    cy.get('.adminWorkspace__workspaceTable tbody tr').should('have.length', 2)
    cy.request('PUT', 'api/workspaces/2/trashed')
    cy.get('.adminWorkspace__workspaceTable tbody tr').should('have.length', 1)
  })
})
