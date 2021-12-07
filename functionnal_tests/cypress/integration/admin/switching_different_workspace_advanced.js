import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

// FIXME - GB - 2021-12-07 - Test from a bugged feature that should be fixed before test it
// See https://github.com/tracim/tracim/issues/5137
describe.skip('Switching between workspaces advanced', () => {
  let workspaceId
  let workspaceLabel

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      workspaceLabel = workspace.label
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('Open and close the workspace advanced app in the dashboard', () => {
    it('should be able to re-open it', () => {
      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)

      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()

      cy.contains('.workspace_advanced__contentpage__header__title', workspaceLabel)

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy="popinFixed__header__button__close"]')
        .click()

      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('.wsContentGeneric__header.workspace_advanced__contentpage__header')
        .should('be.visible')

      cy.contains('.workspace_advanced__contentpage__header__title', workspaceLabel)
    })
  })

  describe('Open and close the workspace advanced app in the admin workspace page', () => {
    it('should be able to re-open it', () => {
      cy.visitPage({ pageName: p.ADMIN_WORKSPACE })
      cy.get('.table__sharedSpace.adminWorkspace__workspaceTable__tr__td-link.primaryColorFontHover')
        .first()
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy="popinFixed__header__button__close"]')
        .click()

      cy.get('.table__sharedSpace.adminWorkspace__workspaceTable__tr__td-link.primaryColorFontHover')
        .first()
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('.wsContentGeneric__header.workspace_advanced__contentpage__header')
        .should('be.visible')
    })
  })

  describe('Switch between 2 workspaces advanced app in the admin workspace page', () => {
    it('should be able to switch', () => {
      cy.visitPage({ pageName: p.ADMIN_WORKSPACE })
      cy.get('.table__sharedSpace.adminWorkspace__workspaceTable__tr__td-link.primaryColorFontHover')
        .first()
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('[data-cy="popinFixed__header__button__close"]')
        .click()

      cy.get('.table__sharedSpace.adminWorkspace__workspaceTable__tr__td-link.primaryColorFontHover')
        .last()
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('.wsContentGeneric__header.workspace_advanced__contentpage__header')
        .should('be.visible')
    })
  })
})
