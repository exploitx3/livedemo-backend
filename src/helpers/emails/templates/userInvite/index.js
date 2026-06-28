import userInvite from './userInvite.js'
import userInviteProps from './userInvite.props.js'
import { buildUnsubscribeUrl } from '../../../emailHelpers.js'

export default {
  data: userInvite,
  exampleProps: userInviteProps,
  transformFunction: function (props) {
    return {
      ...props,
      unsubscribeUrl: buildUnsubscribeUrl(props.unsubscribeToken),
    }
  }
}
