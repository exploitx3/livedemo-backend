import workspaceMemberInvite from './workspaceMemberInvite.js'
import workspaceMemberInviteProps from './workspaceMemberInvite.props.js'
import { buildUnsubscribeUrl } from '../../../emailHelpers.js'

export default {
  data: workspaceMemberInvite,
  exampleProps: workspaceMemberInviteProps,
  transformFunction: function (props) {
    return {
      ...props,
      unsubscribeUrl: buildUnsubscribeUrl(props.unsubscribeToken),
    }
  }
}