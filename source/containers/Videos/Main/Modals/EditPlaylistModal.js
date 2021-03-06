import React, {Component, PropTypes} from 'react'
import {Modal} from 'react-bootstrap'
import Button from 'components/Button'
import {connect} from 'react-redux'
import {
  changePlaylistVideosAsync,
  getMoreVideosForModalAsync
} from 'redux/actions/PlaylistActions'
import SelectVideosForm from './SelectVideosForm'
import SortableThumb from './SortableThumb'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

@DragDropContext(HTML5Backend)
@connect(
  state => ({
    modalType: state.PlaylistReducer.editPlaylistModalType,
    videos: state.PlaylistReducer.videoThumbsForModal,
    loadMoreVideosButton: state.PlaylistReducer.loadMoreButtonForModal
  }),
  {
    changePlaylistVideos: changePlaylistVideosAsync,
    getMoreVideosForModal: getMoreVideosForModalAsync
  }
)
export default class EditPlaylistModal extends Component {
  static propTypes = {
    selectedVideos: PropTypes.array.isRequired,
    playlistId: PropTypes.number.isRequired,
    onHide: PropTypes.func.isRequired,
    modalType: PropTypes.string,
    videos: PropTypes.array,
    loadMoreVideosButton: PropTypes.bool,
    getMoreVideosForModal: PropTypes.func,
    changePlaylistVideos: PropTypes.func,
    playlist: PropTypes.array
  }

  constructor(props) {
    super()
    this.state = {
      selectedVideos: props.selectedVideos,
      mainTabActive: true
    }
    this.handleSave = this.handleSave.bind(this)
  }

  render() {
    const {modalType, videos, loadMoreVideosButton, getMoreVideosForModal, onHide, playlist} = this.props
    const {selectedVideos, mainTabActive} = this.state
    const last = (array) => {
      return array[array.length - 1]
    }
    const lastId = last(videos) ? last(videos).id : 0
    return (
      <Modal
        show
        onHide={onHide}
        animation={false}
        backdrop="static"
        dialogClassName="modal-extra-lg"
      >
        <Modal.Header closeButton>
          {modalType === 'change' ?
            <h4>Change Playlist Videos</h4>
            :
            <h4>Reorder Videos</h4>
          }
        </Modal.Header>
        <Modal.Body>
          <ul className="nav nav-tabs nav-justified" style={{marginBottom: '2em'}}>
            <li
              className={mainTabActive ? 'active' : ''}
              onClick={() => this.setState({mainTabActive: true})}
              style={{cursor: 'pointer'}}
            >
              <a style={{fontWeight: 'bold'}}>{modalType === 'change' ? 'Add Videos' : 'Reorder Videos'}</a>
            </li>
            <li
              className={mainTabActive ? '' : 'active'}
              onClick={() => this.setState({mainTabActive: false})}
              style={{cursor: 'pointer'}}
            >
              <a style={{fontWeight: 'bold'}}>Remove Videos</a>
            </li>
          </ul>
          {mainTabActive && modalType === 'change' &&
            <SelectVideosForm
              videos={videos}
              selectedVideos={selectedVideos}
              loadMoreVideosButton={loadMoreVideosButton}
              onSelect={(selected, videoId) => this.setState({selectedVideos: selected.concat([videoId])})}
              onDeselect={selected => this.setState({selectedVideos: selected})}
              loadMoreVideos={() => { getMoreVideosForModal(lastId) }}
            />
          }
          {mainTabActive && modalType === 'reorder' &&
            <div className="row">
              {selectedVideos.map(videoId => {
                let index = -1
                for (let i = 0; i < videos.length; i++) {
                  if (videos[i].id === videoId) {
                    index = i
                    break
                  }
                }
                return (
                  <SortableThumb
                    key={videos[index].id}
                    video={videos[index]}
                    onMove={({sourceId, targetId}) => {
                      const selectedVideoArray = selectedVideos
                      const sourceIndex = selectedVideoArray.indexOf(sourceId)
                      const targetIndex = selectedVideoArray.indexOf(targetId)
                      selectedVideoArray.splice(sourceIndex, 1)
                      selectedVideoArray.splice(targetIndex, 0, sourceId)
                      this.setState({
                        selectedVideos: selectedVideoArray
                      })
                    }}
                  />
                )
              })}
            </div>
          }
          {!mainTabActive &&
            <SelectVideosForm
              videos={playlist}
              selectedVideos={selectedVideos}
              onSelect={(selected, videoId) => this.setState({selectedVideos: selected.concat([videoId])})}
              onDeselect={selected => this.setState({selectedVideos: selected})}
              loadMoreVideos={() => { getMoreVideosForModal(lastId) }}
            />
          }
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn btn-default" onClick={onHide}>Cancel</Button>
          <Button
            className="btn btn-primary"
            onClick={this.handleSave}
            disabled={selectedVideos.length < 2}
          >
            Save</Button>
        </Modal.Footer>
      </Modal>
    )
  }

  handleSave() {
    const {selectedVideos} = this.state
    const {playlistId, changePlaylistVideos} = this.props
    changePlaylistVideos(playlistId, selectedVideos, this)
  }
}
