import { useState, ChangeEvent } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  Button,
  CardHeader,
  Card,
  CardContent,
  TextField,
  CardActions,
  Grid,
} from "@material-ui/core"
import { useSetAtom } from "jotai"
import { dialogOpenAtom } from "./state"
import { INSERT_CUSTOM_TABLE_COMMAND } from "./plugins/CustomTablePlugin"

const calculateWidth = (columns: number) => {
  return Math.log(columns) * 500
}

const TableDialogContents = () => {
  const setIsDialogOpen = useSetAtom(dialogOpenAtom)
  const [editor] = useLexicalComposerContext()
  const [rows, setRows] = useState("3")
  const [columns, setColumns] = useState("3")

  const handleChangeRows = (event: ChangeEvent<HTMLInputElement>) => {
    setRows(event.target.value)
  }

  const handleChangeColumns = (event: ChangeEvent<HTMLInputElement>) => {
    setColumns(event.target.value)
  }

  const handleConfirm = () => {
    editor.dispatchCommand(INSERT_CUSTOM_TABLE_COMMAND, {
      rows,
      columns,
      width: calculateWidth(parseInt(columns)),
    })
    setIsDialogOpen(false)
  }

  return (
    <Card>
      <CardContent>
        <CardHeader title="Insert Table" />
        <Grid container direction="column" spacing={1}>
          <Grid item>
            <TextField
              fullWidth
              label="Rows"
              value={rows}
              onChange={handleChangeRows}
            />
          </Grid>
          <Grid item>
            <TextField
              fullWidth
              label="Columns"
              value={columns}
              onChange={handleChangeColumns}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button onClick={handleConfirm}> Confirm </Button>
      </CardActions>
    </Card>
  )
}

export default TableDialogContents
