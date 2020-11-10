import { PAGES as p } from '../../support/urls_commands'

// TODO - GB - 2020-11-09 - All tests related to the activity feed must be activated
// and completed after the resolution of the issue https://github.com/tracim/tracim/issues/3600

describe('Switching between tabs', () => {
  let workspaceId, workspaceLabel

  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      workspaceLabel = workspace.label
    })
  })

  describe('from Dashboard', () => {
    it('to All contents', () => {
      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
      cy.contains('.dashboard__workspace__detail__title', workspaceLabel)
      cy.contains('.tab', 'All contents').click()
      cy.contains('.breadcrumbs__item', 'All contents')
      cy.get('.workspace__content__fileandfolder').should('be.visible')
    })

    // it('to Activity feed', () => {
    //   cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceId } })
    //   cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
    //   cy.contains('.dashboard__workspace__detail__title', workspaceLabel)
    //   cy.contains('.tab', 'Activity feed').click()
    //   cy.contains('.breadcrumbs__item', 'Activity feed')
    //   cy.get('').should('be.visible') or cy.contains('', '')
    // })
  })

  describe('from All contents', () => {
    it('to Dashboard', () => {
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
      cy.get('.workspace__content__fileandfolder').should('be.visible')
      cy.contains('.tab', 'Dashboard').click()
      cy.contains('.breadcrumbs__item', 'Dashboard')
      cy.contains('.dashboard__workspace__detail__title', workspaceLabel)
    })

    // it('to Activity feed', () => {
    //   cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
    //   cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
    //   cy.get('.workspace__content__fileandfolder').should('be.visible')
    //   cy.contains('.tab', 'Activity feed').click()
    //   cy.contains('.breadcrumbs__item', 'Activity feed')
    //   cy.get('').should('be.visible') or cy.contains('', '')
    // })
  })

  /*
  describe('from Activity feed', () => {
    it('to Dashboard', () => {
      cy.visitPage({ pageName: p.FEED, params: { workspaceId: workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
      cy.get('').should('be.visible') or cy.contains('', '')
      cy.contains('.tab', 'Dashboard').click()
      cy.contains('.breadcrumbs__item', 'Dashboard')
      cy.contains('.dashboard__workspace__detail__title', workspaceLabel)
    })

    it('to All contents', () => {
      cy.visitPage({ pageName: p.FEED, params: { workspaceId: workspaceId } })
      cy.contains('.pageTitleGeneric__title__label', workspaceLabel)
      cy.get('').should('be.visible') or cy.contains('', '')
      cy.contains('.tab', 'All contents').click()
      cy.contains('.breadcrumbs__item', 'All contents')
      cy.get('.workspace__content__fileandfolder').should('be.visible')
    })
  })
  */
})
