describe('content :: admin > workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui/admin/workspace')
  })
  it('', function () {
    cy.get('.adminWorkspace__description').should('be.visible')
    cy.get('.adminWorkspace__delimiter').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable').should('be.visible')
  })
  it('content of workspaceTable', function () {
    cy.get('.adminWorkspace__workspaceTable th:nth-child(1)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(2)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(3)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(4)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(5)[scope="col"]').should('be.visible')
  })
})
