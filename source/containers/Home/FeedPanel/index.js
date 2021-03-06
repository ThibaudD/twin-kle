import React, {Component, PropTypes} from 'react'
import Heading from './Heading'
import MainContent from './MainContent'
import Loading from 'components/Loading'
import {fetchFeed} from 'redux/actions/FeedActions'
import {connect} from 'react-redux'

@connect(
  null,
  {
    fetchFeed
  }
)
export default class FeedPanel extends Component {
  static propTypes = {
    feed: PropTypes.object,
    userId: PropTypes.number,
    onLikeVideoClick: PropTypes.func,
    fetchFeed: PropTypes.func
  }

  constructor() {
    super()
    this.state = {
      attachedVideoShown: false,
      feedLoaded: false
    }
  }

  componentDidMount() {
    const {fetchFeed, feed} = this.props
    const {feedLoaded} = this.state
    if (!feedLoaded) {
      this.setState({feedLoaded: true})
      fetchFeed(feed)
    }
  }

  render() {
    const {feed, userId, onLikeVideoClick} = this.props
    const {attachedVideoShown} = this.state
    return (
      <div
        className="panel panel-default"
        style={{borderTop: '#e7e7e7 1px solid'}}
      >
        {!!feed.uploaderName &&
          <Heading
            {...feed}
            myId={userId}
            targetCommentUploader={!!feed.targetCommentUploaderName && {name: feed.targetCommentUploaderName, id: feed.targetCommentUploaderId}}
            targetReplyUploader={!!feed.targetReplyUploaderName && {name: feed.targetReplyUploaderName, id: feed.targetReplyUploaderId}}
            rootContent={{id: feed.rootId, title: feed.rootContentTitle, content: feed.rootContent}}
            action={feed.commentId ? 'replied to' : 'commented on'}
            uploader={{name: feed.uploaderName, id: feed.uploaderId}}
            onPlayVideoClick={() => this.setState({attachedVideoShown: true})}
            attachedVideoShown={attachedVideoShown}
            onLikeVideoClick={onLikeVideoClick}
          />
        }
        <div className="panel-body">
          {!!feed.uploaderName &&
            <MainContent
              {...feed}
              onLikeVideoClick={onLikeVideoClick}
              attachedVideoShown={attachedVideoShown}
              myId={userId}
            />
          }
          {!feed.uploaderName &&
            <Loading />
          }
        </div>
      </div>
    )
  }
}
