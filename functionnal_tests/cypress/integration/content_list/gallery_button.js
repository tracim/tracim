import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

let workspaceId
const galleryButton = 'Open the gallery'

describe('In the content list page', () => {
  before(function () {
    this.skip() // FIXME - MB - 2021-10-11 - unstable test, see issue : https://github.com/tracim/tracim/issues/4995
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(function () {
    this.skip() // FIXME - MB - 2021-10-11 - unstable test, see issue : https://github.com/tracim/tracim/issues/4995
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })
  })

  it('should have a specific icon for gallery button', () => {
    cy.contains('[data-cy=IconButton_gallery]', galleryButton)
      .find('.iconbutton__icon')
      .should('have.class', 'fa-image')
  })

  it('click to workspace gallery button should redirect to the gallery app', () => {
    cy.get('[data-cy=IconButton_gallery]')
      .click()
    cy.getTag({ selectorName: s.GALLERY_FRAME })
      .should('be.visible')
  })
})
