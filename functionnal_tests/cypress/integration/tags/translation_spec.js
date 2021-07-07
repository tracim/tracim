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
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId, contentType: 'file', contentId }
      })
      cy.get('[data-cy=popin_right_part_tag]').click()

      cy.changeLanguage('en')
      cy.contains('.tagList__header', 'Tags')
      cy.changeLanguage('fr')
      cy.contains('.tagList__header', 'Étiquettes')
      cy.changeLanguage('pt')
      cy.contains('.tagList__header', 'Etiquetas')
      cy.changeLanguage('de')
      cy.contains('.tagList__header', 'Markierungen')
      cy.changeLanguage('en')
    })
  })

  describe('in a space', () => {
    it('should have translations', () => {
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()
      cy.get('[data-cy=popin_right_part_tag').click()

      cy.changeLanguage('en')
      cy.contains('.tagList__header', 'Tags')
      cy.changeLanguage('fr')
      cy.contains('.tagList__header', 'Étiquettes')
      cy.changeLanguage('pt')
      cy.contains('.tagList__header', 'Etiquetas')
      cy.changeLanguage('de')
      cy.contains('.tagList__header', 'Markierungen')
    })
  })
})
