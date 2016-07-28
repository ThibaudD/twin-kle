import React, {Component} from 'react';
import VideoThumb from 'components/VideoThumb';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import * as VideoActions from 'redux/actions/VideoActions';

const last = (array) => {
  return array[array.length - 1];
}

@connect(
  null,
  dispatch => ({
    actions: bindActionCreators(VideoActions, dispatch)
  })
)
export default class AllVideosPanel extends Component {
  constructor() {
    super()
    this.loadMoreVideos = this.loadMoreVideos.bind(this)
  }

  render() {
    const {loadMoreButton, actions, videos, title, isAdmin, onAddVideoClick} = this.props;
    return (
      <div className="panel panel-primary">
        <div className="panel-heading flexbox-container">
          <h3 className="panel-title pull-left">{title}</h3>
          {isAdmin &&
            <button
              className="btn btn-default pull-right"
              style={{
                marginLeft: 'auto'
              }}
              onClick={() => onAddVideoClick()}
            >+ Add Video</button>
          }
          <div className="clearfix"></div>
        </div>
        <div className="panel-body">
          {videos.map((video, index) => {
            const editable = Number(this.props.userId) === Number(video.uploaderId);
            return (
              <VideoThumb
                to={`videos/${video.id}`}
                size="col-xs-3"
                key={video.id}
                arrayIndex={index}
                editable={editable}
                video={video}
                user={{name: video.uploaderName, id: video.uploaderId}}
                lastVideoId={last(videos) ? Number(last(videos).id) : 0}
              />
            )
          })}
          {loadMoreButton &&
            <div className="text-center col-sm-12">
              <button className="btn btn-default" onClick={this.loadMoreVideos}>Load More</button>
            </div>
          }
        </div>
      </div>
    );
  }

  loadMoreVideos() {
    const {videos, actions} = this.props;
    const lastId = last(videos) ? last(videos).id : 0;
    actions.getMoreVideos(lastId);
  }
}
