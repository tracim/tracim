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
// FIXME - MB - 2022-02-22 - Unstable test, see https://github.com/tracim/tracim/issues/5344

  const joinButtonTestCases = [
    { workspaceFixture: 'openWorkspace', should: 'be.visible' },
    { workspaceFixture: 'baseWorkspace', should: 'not.be.visible' }
  ]

  joinButtonTestCases.forEach(testCase => {
    describe.skip(`With only a ${testCase.workspaceFixture} space`, () => {
      before(() => prepareTest(testCase.workspaceFixture))
      it(`the join space button should ${testCase.should}`, () => {
        cy.get('[data-cy=sidebarJoinWorkspaceBtn]').should(testCase.should)
      })
    })
  })

  describe.skip('Clicking on the join space button', () => {
    before(() => prepareTest('openWorkspace'))
    it('should redirect to the join space page', () => {
      cy.get('[data-cy=sidebarJoinWorkspaceBtn]').click()
      cy.location('pathname').should('eq', '/ui/join-workspace')
    })
  })

})
