
describe('App Agenda', () => {
  let workspace1 = {}
  let workspace2 = {}

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspace1 = workspace
    })
    cy.createRandomWorkspace().then(workspace => {
      workspace2 = workspace
    })
  })

  describe('Switching from app agenda of different workspace', () => {
    it('Should reload the iframe with the proper workspace id', () => {
      cy.visit(`/ui/workspaces/${workspace1.workspace_id}/agenda`)

      cy.get('[data-cy="layoutPageTitle"]').contains(workspace1.label)

      cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspace2.label}"]`)
        .click()

      cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspace2.label}"]`)
        .parents('[data-cy="sidebar__content__navigation__workspace__item"]')

    })
  })
})
