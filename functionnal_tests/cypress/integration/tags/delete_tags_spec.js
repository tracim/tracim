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

  const inputClass = '[data-cy=add_tag]'
  const itemListClass = '[data-cy=tag_list] li'
  const validateButtonClass = '[data-cy=validate_tag]'

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

  describe('in a space', () => {
    it('should create the tag and show it in content autocomplete', () => {
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()
      cy.get('[data-cy=popin_right_part_tag').click()

      cy.get(inputClass).type(tagCreatedByWorkspace)
      cy.get(validateButtonClass).click()

      cy.get('[data-cy=IconButton_DeleteTagFromSpace]').click()
      cy.get('[data-cy=confirm_popup__button_confirm]').click()
      cy.get(itemListClass).should('have.length', 0)
    })
  })

  describe('in a content', () => {
    it('should delete the tag and show it in space settings', () => {
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { workspaceId, contentType: 'file', contentId }
      })
      cy.get('[data-cy=popin_right_part_tag]').click()

      cy.get(inputClass).type(tagCreatedByContent)
      cy.get(validateButtonClass).click()

      cy.get('[data-cy=IconButton_DeleteTagFromSpace]').click()
      cy.get(itemListClass).should('have.length', 0)
    })
  })
})
