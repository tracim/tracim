import { PAGES } from '../../support/urls_commands.js'

describe('content :: admin > workspace', function () {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
  })

  it('should have translations', () => {
    cy.visit('/ui/agenda')

    cy.get('.agendaPage__title').contains('All my agendas')

    cy.changeLanguage('fr')
    cy.get('.agendaPage__title').contains('Tous mes agendas')

    cy.changeLanguage('pt')
    cy.get('.agendaPage__title').contains('Todas as minhas agendas')

    cy.fixture('baseWorkspace').as('workspace').then(workspace =>
      cy.visitPage({ pageName: PAGES.AGENDA, params: { workspaceId: workspace.workspace_id } })
    )

    cy.changeLanguage('en')
    cy.get('.agendaPage__title').contains('Agenda of shared space My Workspace')

    cy.changeLanguage('fr')
    cy.get('.agendaPage__title').contains("Agenda de l'espace partagé My Workspace")

    cy.changeLanguage('pt')
    cy.get('.agendaPage__title').contains('Agenda do espaço partilhado My Workspace')
  })
})
