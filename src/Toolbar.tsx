import InsertTableButton from "./InsertTableButton"
import ToolBar from "@material-ui/core/Toolbar"
import { Paper, makeStyles } from "@material-ui/core"

const useToolbarStyles = makeStyles({
  root: {
    marginBottom: "1px",
    background: "#fff",
  },
})

const ToolbarV7 = () => {
  const { root } = useToolbarStyles()
  return (
    <ToolBar variant="dense" className={root}>
      <InsertTableButton />
    </ToolBar>
  )
}

export default ToolbarV7
