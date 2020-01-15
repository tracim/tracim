import { SELECTORS as s } from '../../support/generic_selector_commands'

context('Upload a file using drop zone', function () {
  let workspaceId
  const pngFile1 = 'Linux-Free-PNG.png'
  const pngFile2 = 'artikodin.png'
  const pdfFile1 = 'the_pdf.pdf'

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visit(`/ui/workspaces/${workspaceId}/dashboard`)
  })

  it('Adds a known member to a workspace using public name', function () {
    cy.get('[data-cy="contentTypeBtn_contents/file"]').click()

    cy.dropFixtureInDropZone(pngFile1, 'image/png', '.filecontent__form', 'file_exemple1.png')
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.get('.previewcomponent__dloption__icon').should('have.length', 1)
    cy.get('#dropdownMenu2').contains('Opened')
  })

  it('Adds multiples files at the same time', function () {
    const fileName1 = 'png_exemple2'
    const fileName2 = 'pdf_exemple2'

    cy.get('[data-cy="contentTypeBtn_contents/file"]').click()

    cy.dropFixtureInDropZone(pngFile2, 'image/png', '.filecontent__form', `${fileName1}.png`)
    cy.dropFixtureInDropZone(pdfFile1, 'application/pdf', '.filecontent__form', `${fileName2}.pdf`)
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName1 } })
      .should('be.visible')
    cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName2 } })
      .should('be.visible')
  })

  it('Adds multiples files at the same time with one already added', function () {
    const fileName1 = 'png_exemple3'
    const fileName2 = 'pdf_exemple3'

    cy.createFile(pngFile1, 'image/png', `${fileName1}.png`, workspaceId)

    cy.get('[data-cy="contentTypeBtn_contents/file"]').click()

    cy.dropFixtureInDropZone(pngFile2, 'image/png', '.filecontent__form', `${fileName1}.png`)
    cy.dropFixtureInDropZone(pdfFile1, 'application/pdf', '.filecontent__form', `${fileName2}.pdf`)
    cy.get('[data-cy=popup__createcontent__form__button]').click()
    cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileName2 } })
      .should('be.visible')
    cy.getTag({ selectorName: s.CARD_POPUP_BODY })
      .get('.file__upload__list__item__label')
      .contains(`${fileName1}.png`)
  })
})
