import workspaceReport from './workspaceReport.js'
import workspaceReportProps from './workspaceReport.props.js'

export default {
  data: workspaceReport,
  exampleProps: workspaceReportProps,
  transformFunction: function (props) {
    let newProps = {...props}
    newProps.conversationsLength = props.conversations.length

    return newProps
  }
}