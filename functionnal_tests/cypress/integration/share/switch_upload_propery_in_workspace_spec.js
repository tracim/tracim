import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Workspace upload property', () => {
  var workspaceId = 1

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })
    cy.contains('.userstatus__role__text', 'Space manager')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe("Disable the workspace's upload feature", () => {
    it('Upload folder should not be visible', function () {
      cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy=popin_right_part_optional_functionalities]')
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy=upload_enabled]')
        .click()

      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId } })

      cy.get('[data-cy=-1]')
        .should('not.exist')
    })
  })

  describe("Enable the workspace's upload feature", () => {
    it('Upload folder should be visible', function () {
      cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy=popin_right_part_optional_functionalities]')
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy=upload_enabled]')
        .click()

      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId } })

      cy.get('[data-cy=-1]')
        .should('be.visible')
    })
  })
})
