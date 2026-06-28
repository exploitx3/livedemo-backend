import newAutoGenAccountCreated from './newAutoGenAccountCreated.js'
import newAutoGenAccountCreatedProps from './newAutoGenAccountCreated.props.js'
import { buildUnsubscribeUrl } from '../../../emailHelpers.js'

export default {
  data: newAutoGenAccountCreated,
  exampleProps: newAutoGenAccountCreatedProps,
  transformFunction: function (props) {
    return {
      ...props,
      unsubscribeUrl: buildUnsubscribeUrl(props.unsubscribeToken),
    }
  }
}