const atSymbolCode = '\ufeff'

export const tinymceAutoCompleteHandleInput = (event, tinymcePosition, setState, fetchMentionList, isAutoCompleteActivated) => {
  if (!event.data) return

  switch (event.data) {
    case '@': {
      const rawHtml = `<span id="autocomplete"><span id="autocomplete__searchtext"><span id="autocomplete__start">${atSymbolCode}</span></span></span>`
      const currentTextContent = tinymce.activeEditor.selection.getSel().anchorNode.textContent.slice(0, tinymce.activeEditor.selection.getSel().anchorOffset)
      const isAtTheBeginningOrHasSpaceBefore = currentTextContent.length === 1 || currentTextContent[currentTextContent.length - 2] === ' '

      if (!isAtTheBeginningOrHasSpaceBefore) break

      tinymce.activeEditor.execCommand('mceInsertContent', false, rawHtml)
      tinymce.activeEditor.focus()
      tinymce.activeEditor.selection.select(tinymce.activeEditor.selection.dom.select('span#autocomplete__searchtext span')[0])
      tinymce.activeEditor.selection.collapse(0)

      setState({
        isAutoCompleteActivated: true,
        tinymcePosition: tinymcePosition
      })
      tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
      break
    }
    default: if (isAutoCompleteActivated) tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
  }
}

export const tinymceAutoCompleteSearchForMentionCandidate = async (fetchMentionList, setState) => {
  if (!tinymce.activeEditor.getDoc().getElementById('autocomplete__searchtext')) return

  const mentionCandidate = tinymce.activeEditor.getDoc().getElementById('autocomplete__searchtext').textContent.replace(atSymbolCode, '')

  const fetchSearchMentionList = await fetchMentionList(mentionCandidate)
  setState({
    autoCompleteItemList: fetchSearchMentionList,
    autoCompleteCursorPosition: 0
  })
}

export const tinymceAutoCompleteHandleKeyUp = (event, setState, isAutoCompleteActivated, fetchMentionList) => {
  if (!isAutoCompleteActivated || event.key !== 'Backspace') return

  const autoCompleteMentionCandidateNode = tinymce.activeEditor.dom.select('span#autocomplete')[0]

  if (autoCompleteMentionCandidateNode && autoCompleteMentionCandidateNode.textContent.includes(atSymbolCode)) {
    tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
  } else setState({ isAutoCompleteActivated: false })
}

export const tinymceAutoCompleteHandleKeyDown = (event, setState, isAutoCompleteActivated, autoCompleteCursorPosition, autoCompleteItemList, fetchMentionList) => {
  if (!isAutoCompleteActivated) return

  switch (event.key) {
    case ' ': {
      tinymce.activeEditor.focus()
      const query = tinymce.activeEditor.getDoc().getElementById('autocomplete__searchtext').textContent.replace(atSymbolCode, '')
      const selection = tinymce.activeEditor.dom.select('span#autocomplete')[0]
      tinymce.activeEditor.dom.remove(selection)
      tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('span#autocomplete')[0])
      tinymce.activeEditor.execCommand('mceInsertContent', false, query)

      setState({ isAutoCompleteActivated: false, autoCompleteItemList: [] })
      break
    }
    case 'Enter': {
      tinymceAutoCompleteHandleClickItem(autoCompleteItemList[autoCompleteCursorPosition], setState)
      event.preventDefault()
      break
    }
    case 'ArrowUp': {
      if (autoCompleteCursorPosition > 0) {
        setState(prevState => ({
          autoCompleteCursorPosition: prevState.autoCompleteCursorPosition - 1
        }))
      }
      event.preventDefault()
      break
    }
    case 'ArrowDown': {
      if (autoCompleteCursorPosition < autoCompleteItemList.length - 1) {
        setState(prevState => ({
          autoCompleteCursorPosition: prevState.autoCompleteCursorPosition + 1
        }))
      }
      event.preventDefault()
      break
    }
  }
}

export const tinymceAutoCompleteHandleClickItem = (item, setState) => {
  tinymce.activeEditor.focus()
  const selection = tinymce.activeEditor.dom.select('span#autocomplete')[0]
  tinymce.activeEditor.selection.select(tinymce.activeEditor.dom.select('span#autocomplete')[0])
  tinymce.activeEditor.execCommand('mceInsertContent', false, `${item.mention}&nbsp;`)
  tinymce.activeEditor.dom.remove(selection)

  setState({ isAutoCompleteActivated: false })
}

export const tinymceAutoCompleteHandleSelectionChange = (selectionId, setState, isAutoCompleteActivated) => {
  if (selectionId === 'autocomplete__searchtext' || selectionId === 'autocomplete__start') {
    if (!isAutoCompleteActivated) setState({ isAutoCompleteActivated: true })
    return
  }

  if (isAutoCompleteActivated) setState({ isAutoCompleteActivated: false })
}
