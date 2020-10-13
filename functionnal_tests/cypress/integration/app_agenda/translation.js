// RJ - 2020-06-08 - App agenda cannot be tested. The backend disconnects the user
// because they cannot be authentified with CalDAV
// import { PAGES } from '../../support/urls_commands.js'
//
// describe('Agenda', function () {
//   before(function () {
//     cy.resetDB()
//     cy.setupBaseDB()
//     cy.loginAs('administrators')
//   })
//
//   it('should have translations', () => {
//     cy.fixture('baseWorkspace').as('workspace').then(workspace => {
//
//       cy.visit('/ui/agenda')
//
//       cy.get('.agendaPage__title').contains('All my agendas')
//
//       cy.changeLanguage('fr')
//       cy.get('.agendaPage__title').contains('Tous mes agendas')
//
//       cy.changeLanguage('pt')
//       cy.get('.agendaPage__title').contains('Todas as minhas agendas')
//
//       cy.visitPage({ pageName: PAGES.AGENDA, params: { workspaceId: workspace.workspace_id } })
//
//       cy.get('.agendaPage__title').contains('Agenda of space My Workspace')
//
//       cy.changeLanguage('fr')
//       cy.get('.agendaPage__title').contains("Agenda de l'espace My Workspace")
//
//       cy.changeLanguage('pt')
//       cy.get('.agendaPage__title').contains('Agenda do espaço My Workspace')
//     })
//   })
// })
