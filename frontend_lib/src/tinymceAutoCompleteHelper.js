const MENTION_AUTOCOMPLETE_REGEX = /(?:^|\s)@([a-zA-Z\-_]*)$/

const seekUserNameEnd = (text, offset) => {
  while (offset < text.length && /[a-zA-Z\-_]/.test(text[offset])) {
    offset++
  }

  return offset
}

const getTextOnCursor = () => {
  const sel = tinymce.activeEditor.selection.getSel()
  const text = sel.anchorNode.textContent
  const end = seekUserNameEnd(text, sel.anchorOffset)
  return text.substring(0, end)
}

export const tinymceAutoCompleteHandleInput = (e, setState, fetchMentionList, isAutoCompleteActivated) => {
  if (MENTION_AUTOCOMPLETE_REGEX.test(getTextOnCursor())) {
    if (isAutoCompleteActivated) {
      tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
      return
    }

    if (e && (e.data || e.key === 'Backspace')) {
      // The user typed something in a mention or in the beginning of a mention
      setState({ isAutoCompleteActivated: true })
      tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
      return
    }
  }

  setState({ isAutoCompleteActivated: false })
}

const tinymceAutoCompleteSearchForMentionCandidate = async (fetchMentionList, setState) => {
  const mentionCandidate = getTextOnCursor().match(MENTION_AUTOCOMPLETE_REGEX)
  if (!mentionCandidate) {
    setState({ isAutoCompleteActivated: false })
    return
  }

  const nameCandidate = mentionCandidate[1]
  const fetchSearchMentionList = await fetchMentionList(nameCandidate)
  setState({
    autoCompleteItemList: fetchSearchMentionList.filter(item => item.mention),
    autoCompleteCursorPosition: 0
  })
}

export const tinymceAutoCompleteHandleKeyUp = (event, setState, isAutoCompleteActivated, fetchMentionList) => {
  if (!isAutoCompleteActivated || event.key !== 'Backspace') return

  tinymceAutoCompleteSearchForMentionCandidate(fetchMentionList, setState)
}

export const tinymceAutoCompleteHandleKeyDown = (event, setState, isAutoCompleteActivated, autoCompleteCursorPosition, autoCompleteItemList) => {
  if (!isAutoCompleteActivated) return

  if (event.key === 'Escape') {
    setState({ isAutoCompleteActivated: false })
    return
  }

  switch (event.key) {
    case ' ': {
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
  if (!item.mention) {
    console.log('BUG: this member does not have a username')
    return
  }

  const sel = tinymce.activeEditor.selection.getSel()
  const text = sel.anchorNode.textContent

  let posAt = sel.anchorOffset
  while (posAt >= 0 && text[posAt] !== '@') {
    posAt--
  }

  let textBegin, textEnd

  if (text[posAt] === '@') {
    textBegin = text.substring(0, posAt) + '@' + item.mention + '\u00A0'
    textEnd = text.substring(seekUserNameEnd(text, sel.anchorOffset))
  } else {
    console.log('BUG: mention autocomplete: did not find "@"')
    textBegin = sel.anchorNode.textContent + ' @' + item.mention + '\u00A0'
    textEnd = ''
  }

  sel.anchorNode.textContent = textBegin + textEnd
  sel.collapse(sel.anchorNode, textBegin.length)
  setState({ isAutoCompleteActivated: false })
}

export const tinymceAutoCompleteHandleSelectionChange = (setState, fetchMentionList, isAutoCompleteActivated) => {
  tinymceAutoCompleteHandleInput(null, setState, fetchMentionList, isAutoCompleteActivated)
}
