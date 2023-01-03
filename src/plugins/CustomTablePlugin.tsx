/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  TableNode,
  TableCellNode,
  TableRowNode,
  $isTableNode,
  $createTableRowNode,
  $createTableCellNode,
  TableCellHeaderStates,
  applyTableHandlers,
  HTMLTableElementWithWithTableSelectionState,
} from "@lexical/table"
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $createParagraphNode,
  $createTextNode,
  $nodesOfType,
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical"
import { useEffect } from "react"
import CustomTableNode, {
  $createCustomTableNode,
} from "../nodes/CustomTableNode"

export const INSERT_CUSTOM_TABLE_COMMAND = createCommand<{
  columns: string
  rows: string
  width: number
}>()

function $createCustomTableNodeWithDimensions(
  rowCount: number,
  columnCount: number,
  width: number,
) {
  const tableNode = $createCustomTableNode(width)

  for (let r = 0; r < rowCount; r++) {
    const tableRowNode = $createTableRowNode()

    for (let c = 0; c < columnCount; c++) {
      // When inserting a new table cell, the headerStates are used to check whether the cell
      // should also be a header cell (tr). If a new cell is inserted above or below a cell with
      // TableCellHeaderState.COLUMN, the new cell will also have TableCellHeaderState.COLUMN.
      // If the cell is inserted to the left or right of a cell with TableCellHeaderState.ROW,
      // the new cell will also have TableCellHeaderState.ROW

      let headerState =
        r === 0 ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS

      const tableCellNode = $createTableCellNode(headerState)
      const paragraphNode = $createParagraphNode()
      paragraphNode.append($createTextNode())
      tableCellNode.append(paragraphNode)
      tableRowNode.append(tableCellNode)
    }

    tableNode.append(tableRowNode)
  }

  return tableNode
}

const TablePlugin = () => {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    if (!editor.hasNodes([CustomTableNode, TableCellNode, TableRowNode])) {
      {
        throw Error(
          `TablePlugin: TableNode, TableCellNode or TableRowNode not registered on editor`,
        )
      }
    }

    return editor.registerCommand(
      INSERT_CUSTOM_TABLE_COMMAND,
      ({ columns, rows, width }) => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          return true
        }

        const focus = selection.focus
        const focusNode = focus.getNode()

        if (!focusNode) return true

        const tableNode = $createCustomTableNodeWithDimensions(
          Number(rows),
          Number(columns),
          width,
        )

        // From lexical/Lexical.dev.js line 8015, under ElementNode:
        // A shadow root is a Node that behaves like RootNode. The shadow root (and RootNode) mark the
        // end of the hiercharchy, most implementations should treat it as if there's nothing (upwards)
        // beyond this point. For example, node.getTopLevelElement(), when performed inside a TableCellNode
        // will return the immediate first child underneath TableCellNode instead of RootNode.

        if ($isRootOrShadowRoot(focusNode)) {
          const target = focusNode.getChildAtIndex(focus.offset)
          target ? target.insertBefore(tableNode) : focusNode.append(tableNode)
          tableNode.insertBefore($createParagraphNode())
        } else {
          const topLevelNode = focusNode.getTopLevelElementOrThrow()
          topLevelNode.insertAfter(tableNode)
        }

        tableNode.insertAfter($createParagraphNode())

        const firstCell = tableNode
          .getFirstChildOrThrow()
          .getFirstChildOrThrow()
        firstCell.select()

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  useEffect(() => {
    const tableSelections = new Map()

    const initializeTableNode = (tableNode: TableNode) => {
      const nodeKey = tableNode.getKey()
      const tableElement = editor.getElementByKey(
        nodeKey,
      ) as HTMLTableElementWithWithTableSelectionState

      if (tableElement && !tableSelections.has(nodeKey)) {
        const tableSelection = applyTableHandlers(
          tableNode,
          tableElement,
          editor,
        )
        tableSelections.set(nodeKey, tableSelection)
      }
    } // Plugins might be loaded _after_ initial content is set, hence existing table nodes
    // won't be initialized from mutation[create] listener. Instead doing it here,

    editor.getEditorState().read(() => {
      const tableNodes = $nodesOfType(TableNode)

      for (const tableNode of tableNodes) {
        if ($isTableNode(tableNode)) {
          initializeTableNode(tableNode)
        }
      }
    })
    const unregisterMutationListener = editor.registerMutationListener(
      CustomTableNode,
      (nodeMutations) => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === "created") {
            editor.getEditorState().read(() => {
              const tableNode = $getNodeByKey(nodeKey)

              if ($isTableNode(tableNode)) {
                initializeTableNode(tableNode)
              }
            })
          }

          if (mutation === "destroyed") {
            const tableSelection = tableSelections.get(nodeKey)

            if (tableSelection) {
              tableSelection.removeListeners()
              tableSelections.delete(nodeKey)
            }
          }
        }
      },
    )
    return () => {
      unregisterMutationListener() // Hook might be called multiple times so cleaning up tables listeners as well,
      // as it'll be reinitialized during recurring call

      for (const [, tableSelection] of tableSelections) {
        tableSelection.removeListeners()
      }
    }
  }, [editor])
  return null
}

export default TablePlugin
