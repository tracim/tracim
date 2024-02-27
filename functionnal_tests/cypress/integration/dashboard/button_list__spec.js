import { PAGES as p } from '../../support/urls_commands'

let workspaceTest

describe('Dashboard button list', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceTest = workspace
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })
    cy.contains('.pageTitleGeneric__title__label', workspaceTest.label)
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('if agenda is enabled', () => {
    it('should show button agenda and space settings', () => {
      cy.get('button[title="Open the agenda"]').should('be.visible')
      cy.get('button[title="Space settings"]').should('be.visible')
    })
  })

  describe('if agenda is not enabled', () => {
    it('should show button space settings but not agenda', () => {
      cy.enableAgenda(workspaceTest, false)
      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })
      cy.get('button[title="Open the agenda"]').should('not.exist')
      cy.get('button[title="Space settings"]').should('be.visible')
    })

  })
  describe('if publication is enabled', () => {
    it('should show button publication and space settings', () => {
      cy.get('button[title="Publish some news"]').should('be.visible')
      cy.get('button[title="Space settings"]').should('be.visible')
    })
  })

  describe('if publication is not enabled', () => {
    it('should show button space settings but not publication', () => {
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.get('button[title="Space settings"]').click()
      cy.contains('.workspace_advanced__contentpage__header__title', workspaceTest.label)

      cy.get('[data-cy=popin_right_part_optional_functionalities]').click()
      cy.get('div[title="News activated"] > .switch').click()
      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceTest.workspace_id } })

      cy.get('button[title="Publish some news"]').should('not.exist')
      cy.get('button[title="Space settings"]').should('be.visible')
    })
  })

  const buttonList = [
    'Start a topic',
    'Upload files',
    'Write a note',
    'Create a folder',
    'Open the gallery'
  ]
  for (const button of buttonList) {
    it(`should show button ${button}`, () => {
      cy.get(`button[title="${button}"]`).should('be.visible')
    })
  }
})
