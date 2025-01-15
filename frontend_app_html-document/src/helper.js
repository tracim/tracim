export const generateTocHtml = text => {
  const domParser = new window.DOMParser()
  const textDom = domParser.parseFromString(text, 'text/html')
  const titleList = Array.from(textDom.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(node => ({
    titleRank: node.tagName.substring(node.tagName.length - 1), // INFO - CH - 2025-01-13 - extract number of h1..6
    titleText: node.textContent
  }))

  if (titleList.length <= 1) return ''

  const summaryHtml = generateTocHtmlFromList(titleList)
  return summaryHtml.outerHTML
}

// INFO - CH - 2025-01-13 - Function inspired from
// https://stackoverflow.com/questions/27583871/dynamically-create-a-summary-based-on-a-document
// The trick is to use document.createElement and document.appendChild to not have to handle
// the closing ol and li tags
const generateTocHtmlFromList = (titleList) => {
  const listStack = []
  const toc = document.createElement('ol')

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

    const li = document.createElement('li')
    li.innerHTML = title.titleText

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
