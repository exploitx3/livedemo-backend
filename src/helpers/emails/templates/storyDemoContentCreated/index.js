import storyDemoContentCreated from './storyDemoContentCreated.js'
import storyDemoContentCreatedProps from './storyDemoContentCreated.props.js'
import { buildUnsubscribeUrl } from '../../../emailHelpers.js'

export default {
  data: storyDemoContentCreated,
  exampleProps: storyDemoContentCreatedProps,
  transformFunction: function (props) {
    return {
      ...props,
      unsubscribeUrl: buildUnsubscribeUrl(props.unsubscribeToken),
    }
  }
}