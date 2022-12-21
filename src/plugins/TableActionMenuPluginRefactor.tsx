import { useEffect, useRef, useState } from "react"
import { Icon, IconButton, makeStyles } from "@material-ui/core"
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import { $getTableCellNodeFromLexicalNode } from "@lexical/table"

const useTableMenuButtonStyles = makeStyles({
  root: {
    position: "absolute",
  },
  //   maybe change the hover styles too?
})

type TableMenuButtonProperties = {
  anchorElement: HTMLElement
}

const TableMenuButton = ({ anchorElement }: TableMenuButtonProperties) => {
  const { root } = useTableMenuButtonStyles()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  console.log(anchorElement)
  useEffect(() => {
    // When resizing the viewport, the button can become misplaced
    const menuButtonDOM = menuButtonRef.current

    if (!menuButtonDOM) return

    const menuButtonRectangle = menuButtonDOM.getBoundingClientRect()
    const anchorElementRectangle = anchorElement.getBoundingClientRect()

    menuButtonDOM.style.left = `${
      anchorElementRectangle.right - menuButtonRectangle.width
    }px`
    menuButtonDOM.style.top = `${
      anchorElementRectangle.top + 10 - menuButtonRectangle.height / 2
    }px`
  }, [anchorElement])

  return (
    <IconButton size="small" ref={menuButtonRef} className={root}>
      <KeyboardArrowDownIcon />
    </IconButton>
  )
}

const TableActionMenuPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [currentTableCellDOM, setCurrentTableCellDOM] =
    useState<HTMLElement | null>(null)

  useEffect(() => {
    // register a listener for selection command,
    // if the selection is inside a table cell, get the current DOM element for that cell
    // and store it in state, which is used by TableMenuButton for positioning
    // switch to using atom for this later
    return editor.registerCommand(
      // lexical's demo uses registerUpdateListener, maybe that's the right choice, look into later
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) return true
        // lexical also checks for other
        const tableCellNode = $getTableCellNodeFromLexicalNode(
          selection.anchor.getNode(),
        )

        if (!tableCellNode) {
          setCurrentTableCellDOM(null)
          return true
        }

        const tableCellParentNodeDOM = editor.getElementByKey(
          tableCellNode.getKey(),
        )

        setCurrentTableCellDOM(tableCellParentNodeDOM)
        return true
      },
      1,
    )
  }, [editor])

  if (currentTableCellDOM)
    return createPortal(
      // maybe a popper or popover mui element here instead
      <TableMenuButton anchorElement={currentTableCellDOM} />,
      document.body,
    )

  return null
}

export default TableActionMenuPlugin
