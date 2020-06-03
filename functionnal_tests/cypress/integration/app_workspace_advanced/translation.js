describe('App Workspace Advanced', function () {
  const newDescription = 'description'
  const workspaceId = 1
  const workspaceDescription = ''

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visit('/ui/admin/workspace')
  })

  it('should have translations', () => {
    cy.get('.adminWorkspace__workspaceTable').contains('Shared space')

    cy.changeLanguage('fr')
    cy.get('.adminWorkspace__workspaceTable').contains('Espace partagé')

    cy.changeLanguage('pt')
    cy.get('.adminWorkspace__workspaceTable').contains('Espaço partilhado')
  })
})
