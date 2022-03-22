import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

describe('Tags', () => {
  let workspaceId
  let contentId

  const fileTitle = 'FileForSwitch'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        .then(content => {
          contentId = content.content_id
        })
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('in a content', () => {
    it('should have translations', () => {
      cy.changeLanguage('en')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } })
      cy.get('[data-cy=popin_right_part_tag]').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Tags')

      cy.changeLanguage('fr')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } })
      cy.get('[data-cy=popin_right_part_tag]').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Étiquettes')

      cy.changeLanguage('pt')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } })
      cy.get('[data-cy=popin_right_part_tag]').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Etiquetas')

      cy.changeLanguage('de')
      cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } })
      cy.get('[data-cy=popin_right_part_tag]').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Markierungen')

      cy.changeLanguage('en')
    })
  })

  describe('in a space', () => {
    it('should have translations', () => {
      cy.changeLanguage('en')
      cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Tags')

      cy.changeLanguage('fr')
      cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Étiquettes')

      cy.changeLanguage('pt')
      cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Etiquetas')

      cy.changeLanguage('de')
      cy.visitPage({ pageName: PAGES.ADVANCED_DASHBOARD, params: { workspaceId } })
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.contains('.wsContentGeneric__content__right__content__title', 'Markierungen')
    })
  })
})
