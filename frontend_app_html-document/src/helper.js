export const generateTocHtml = htmlContent => {
  const domParser = new window.DOMParser()
  const textDom = domParser.parseFromString(htmlContent, 'text/html')
  const titleList = Array.from(textDom.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(node => ({
    titleRank: node.tagName.substring(node.tagName.length - 1), // INFO - CH - 2025-01-13 - extract number of h1..6
    titleText: node.textContent || '',
    titleId: node.id || ''
  }))

  if (titleList.length <= 1) return ''

  const summaryHtml = generateTocHtmlFromList(titleList)
  return summaryHtml.outerHTML
}

// INFO - CH - 2025-01-13 - Function inspired from
// https://stackoverflow.com/questions/27583871/dynamically-create-a-summary-based-on-a-document
// The trick is to use document.createElement and document.appendChild to not have to handle
// the closing ol and li tags
// Param titleList: [{ titleLevel: int, titleText: str, titleId: str }, ...]
const generateTocHtmlFromList = (titleList) => {
  const listStack = []
  const toc = document.createElement('ol')

  console.log('titleList', titleList)

  titleList.forEach(title => {
    const currentLevel = Number(title.titleRank)
    let lastListItem = listStack[listStack.length - 1]
    let lastListItemLevel = lastListItem ? lastListItem.level : 0

    if (currentLevel <= lastListItemLevel) {
      while (currentLevel <= lastListItemLevel) {
        listStack.pop()
        lastListItem = listStack[listStack.length - 1]
        lastListItemLevel = lastListItem ? lastListItem.level : 0
      }
    }

    const a = document.createElement('a')
    // todo: use url builder
    a.href = `#${title.titleId}`
    a.innerHTML = title.titleText
    const li = document.createElement('li')
    li.appendChild(a)

    const ol = document.createElement('ol')
    li.appendChild(ol)

    if (lastListItem) {
      lastListItem.ol.appendChild(li)
    } else {
      toc.appendChild(li)
    }

    listStack.push({
      level: currentLevel,
      ol: ol
    })
  })

  return toc
}

export const addIdToTitle = (htmlContent) => {
  const slugify = require('slugify')
  const domParser = new window.DOMParser()
  const textDom = domParser.parseFromString(htmlContent, 'text/html')
  Array.from(textDom.querySelectorAll('h1, h2, h3, h4, h5, h6')).forEach(htmlElement => {
    htmlElement.id = slugify(htmlElement.textContent)
  })

  return textDom.body.outerHTML
}
