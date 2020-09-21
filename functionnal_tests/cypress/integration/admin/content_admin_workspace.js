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
    // TODO - BL - 2018/12/13 - Check why next test randomly cannot load
    // homepage if we remove wait.
    cy.wait(2000)
  })
  it('checks the columns of the space table', function () {
    cy.get('.adminWorkspace__workspaceTable th:nth-child(1)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(2)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(3)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(4)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(5)[scope="col"]').should('be.visible')
  })
  it('checks the delete space button', function() {
    cy.get('.adminWorkspace__workspaceTable tbody tr:first .adminWorkspace__table__delete__icon').click()

    // Cancel
    cy.get('.adminworkspaceuser__popup').should('be.visible')
    cy.get('.adminworkspaceuser__popup .outlineTextBtn').click()
    cy.contains('.adminWorkspace__workspaceTable tbody tr:first td:nth-child(2)', 'My space')

    // Delete
    cy.get('.adminWorkspace__workspaceTable tbody tr:first .adminWorkspace__table__delete__icon').click()
    cy.get('.adminworkspaceuser__popup .highlightBtn').click()
    cy.contains('.adminWorkspace__workspaceTable tbody tr:first td:nth-child(2)', 'There is no space yet')
  })
  it('checks the create space button', function() {
    cy.get('.adminWorkspace__btnnewworkspace__btn').click()
    cy.get('.createcontent__form__input').click().type('A test space')
    cy.get('button.createcontent__form__button').click()
    cy.location('pathname').should('be.equal', '/ui/workspaces/2/dashboard')
  })
  it('checks space modified TLM', function() {
    cy.request('PUT', 'api/workspaces/1', { label: 'Modified space', description: ''})
    cy.contains('.adminWorkspace__workspaceTable tbody tr:first td:nth-child(2)', 'Modified s')
  })
  it('checks space added and deleted TLM', function() {
    cy.request(
      'POST',
      'api/workspaces',
      { label: 'A new space', description: '', access_type: 'confidential', default_user_role: 'reader'}
    )
    cy.get('.adminWorkspace__workspaceTable tbody tr').should('have.length', 2)
    cy.request('PUT', 'api/workspaces/2/trashed')
    cy.get('.adminWorkspace__workspaceTable tbody tr').should('have.length', 1)
  })
})
