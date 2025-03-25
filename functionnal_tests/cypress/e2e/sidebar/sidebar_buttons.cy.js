import { PAGES as p } from '../../support/urls_commands.js'

const prepareTest = (workspaceFixture) => {
  cy.logout()
  cy.resetDB()
  cy.setupBaseDB()
  cy.loginAs('administrators')
  cy.createWorkspace(workspaceFixture)
  cy.loginAs('users')
  cy.visitPage({
    pageName: p.HOME
  })
}

describe('Sidebar buttons', () => {
  const joinButtonTestCases = [
    { workspaceFixture: 'openWorkspace', should: 'be.visible' },
    { workspaceFixture: 'baseWorkspace', should: 'not.be.visible' }
  ]

  joinButtonTestCases.forEach(testCase => {
    describe(`With only a ${testCase.workspaceFixture} space`, () => {
      before(() => prepareTest(testCase.workspaceFixture))
      // TODO - MP - 09-02-2023
      // See https://github.com/tracim/tracim/issues/6097
      // Also https://github.com/tracim/tracim/issues/2872
      it.skip(`the join space button should ${testCase.should}`, () => {
        cy.get('[data-cy=sidebarJoinSpaceBtn]').should(testCase.should)
      })
    })
  })

  describe('Clicking on the join space button', () => {
    before(() => prepareTest('openWorkspace'))
    // TODO - MP - 09-02-2023
    // See https://github.com/tracim/tracim/issues/6097
    // Also https://github.com/tracim/tracim/issues/2872
    it.skip('should redirect to the join space page', () => {
      cy.get('[data-cy=sidebarJoinSpaceBtn]').click()
      cy.location('pathname').should('eq', '/ui/join-workspace')
    })
  })

})
