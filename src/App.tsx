import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table"
import { ListItemNode, ListNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { Grid, Paper, makeStyles } from "@material-ui/core"
import CustomTableNode from "./nodes/CustomTableNode"
import ToolbarV7Plugin from "./Toolbar"
import TableActionMenuPluginRefactor from "./plugins/TableActionMenuPluginRefactor"
import {
  useEditorInputStyles,
  useEditorPlaceholderStyles,
} from "./useEditorStyles"
import TablePlugin from "./plugins/CustomTablePlugin"
import "./editor.css"
import TreeViewPlugin from "./plugins/TreeViewPlugin"

const usePaperStyles = makeStyles({
  root: {
    position: "relative",
  },
})

const editorTheme = {
  paragraph: "editor-paragraph",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
  },
  table: "editor-table",
  tableCell: "editor-tablecell",
  tableCellHeader: "editor-tablecell-head",
}

const onError = (error: Error) => {
  // eslint-disable-next-line no-console
  console.error(error)
}

const initialConfig = {
  namespace: "DictyEditor",
  theme: { ...editorTheme },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListItemNode,
    ListNode,
    CustomTableNode,
    TableCellNode,
    TableRowNode,
  ],
  onError,
}

const EditorV8 = () => {
  const inputClasses = useEditorInputStyles()
  const placeholderClasses = useEditorPlaceholderStyles()
  const paperClasses = usePaperStyles()

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <TablePlugin />
      <TableActionMenuPluginRefactor />
      <Grid container direction="column">
        <Grid item>
          <ToolbarV7Plugin />
        </Grid>
        <Grid item>
          <Paper className={paperClasses.root}>
            <RichTextPlugin
              // latest version of lexical requires error boundary prop
              contentEditable={
                <ContentEditable className={inputClasses.root} />
              }
              placeholder={
                <div className={placeholderClasses.root}>
                  Enter some text...
                </div>
              }
            />
          </Paper>
        </Grid>
      </Grid>
      <TreeViewPlugin />
    </LexicalComposer>
  )
}

export default EditorV8
