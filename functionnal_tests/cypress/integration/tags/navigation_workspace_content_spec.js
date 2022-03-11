import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

describe('Create tags', () => {
  let workspaceId
  let contentId

  const fileTitle = 'FileForSwitch'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  const tagCreatedByWorkspace = 'Space tag'
  const tagCreatedByContent = 'Content tag'

  const flashMessageClass = '.flashmessage__container__content__text__paragraph'
  const flashMessageTextWorkspace = 'Your tag has been created'
  const flashMessageTextContent = 'Your tag has been added'

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
    it('should create the tag and show it in space settings', () => {
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { contentId }
      })
      cy.get('[data-cy=popin_right_part_tag]').click()

      cy.get('[data-cy=add_tag]').type(tagCreatedByContent)
      cy.get('[data-cy=validate_tag]').click()
      cy.contains(flashMessageClass, flashMessageTextContent)

      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()
      cy.get('[data-cy=popin_right_part_tag]').click()

      cy.contains('[data-cy=tag_list] li', tagCreatedByContent)
    })
  })

  describe('in a space', () => {
    it('should create the tag and show it in content autocomplete', () => {
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()
      cy.get('[data-cy=popin_right_part_tag').click()

      cy.get('[data-cy=add_tag]').type(tagCreatedByWorkspace)
      cy.get('[data-cy=validate_tag]').click()
      cy.contains(flashMessageClass, flashMessageTextWorkspace)

      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { contentId }
      })
      cy.get('[data-cy=popin_right_part_tag]').click()

      cy.get('[data-cy=add_tag]').type(tagCreatedByWorkspace.substring(0, 5))
      cy.contains('.autocomplete__item', tagCreatedByWorkspace)
    })
  })
})
