import { PAGES as p } from '../../support/urls_commands'

let workspace1
let workspace2
let workspace3
let workspace4

const fileLabel = '.FilenameWithExtension__label'
const defaultLabel = '.feedItemHeader__label'

const contentWorkspace1 = 'Thread'
const contentWorkspace2 = 'File'
const contentWorkspace3 = 'Note'
const contentWorkspace4 = 'Folder'

function goToSpace(workspace) {
  cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspace.workspace_id } })
  cy.contains('.pageTitleGeneric__title__label', workspace.label)
  cy.get('.workspaceRecentActivities').should('be.visible')
  cy.contains('.workspaceRecentActivities__header', 'Recent activities')
}

describe('Dashboard', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createRandomWorkspace().then(workspace => {
      workspace1 = workspace
      cy.createThread(contentWorkspace1, workspace.workspace_id)
    })
    cy.createRandomWorkspace().then(workspace => {
      workspace2 = workspace
      cy.createFile('Linux-Free-PNG.png', 'image/png', 'File', workspace.workspace_id)
    })
    cy.createRandomWorkspace().then(workspace => {
      workspace3 = workspace
      cy.createHtmlDocument('Note', workspace.workspace_id)
    })
    cy.createRandomWorkspace().then(workspace => {
      workspace4 = workspace
      cy.createFolder('Folder', workspace.workspace_id)
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should have only the recent activities from its own space', () => {
    goToSpace(workspace1)
    cy.contains(defaultLabel, contentWorkspace1)
    cy.contains(fileLabel, contentWorkspace2).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace3).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace4).should('not.exist')

    goToSpace(workspace2)
    cy.contains(fileLabel, contentWorkspace2)
    cy.contains(defaultLabel, contentWorkspace1).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace3).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace4).should('not.exist')

    goToSpace(workspace4)
    cy.contains(defaultLabel, contentWorkspace4)
    cy.contains(fileLabel, contentWorkspace2).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace3).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace1).should('not.exist')

    goToSpace(workspace3)
    cy.contains(defaultLabel, contentWorkspace3)
    cy.contains(fileLabel, contentWorkspace2).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace4).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace1).should('not.exist')

    goToSpace(workspace2)
    cy.contains(fileLabel, contentWorkspace2)
    cy.contains(defaultLabel, contentWorkspace1).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace3).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace4).should('not.exist')

    goToSpace(workspace1)
    cy.contains(defaultLabel, contentWorkspace1)
    cy.contains(fileLabel, contentWorkspace2).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace3).should('not.exist')
    cy.contains(defaultLabel, contentWorkspace4).should('not.exist')
  })
})
