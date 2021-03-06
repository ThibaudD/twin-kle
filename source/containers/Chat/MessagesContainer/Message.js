import React, {Component, PropTypes} from 'react'
import moment from 'moment'
import ProfilePic from 'components/ProfilePic'
import UsernameText from 'components/Texts/UsernameText'
import {connect} from 'react-redux'
import SmallDropdownButton from 'components/SmallDropdownButton'
import ConfirmModal from 'components/Modals/ConfirmModal'
import {cleanStringWithURL} from 'helpers/stringHelpers'
import EditTextArea from 'components/Texts/EditTextArea'
import {editMessage, deleteMessage, saveMessage} from 'redux/actions/ChatActions'

@connect(
  state => ({
    myId: state.UserReducer.userId
  }),
  {
    onEditDone: editMessage,
    onDelete: deleteMessage,
    saveMessage
  }
)
export default class Message extends Component {
  static propTypes = {
    message: PropTypes.object,
    style: PropTypes.object,
    myId: PropTypes.number,
    onEditDone: PropTypes.func,
    onDelete: PropTypes.func,
    saveMessage: PropTypes.func,
    index: PropTypes.number
  }
  constructor() {
    super()
    this.state = {
      onEdit: false,
      confirmModalShown: false
    }
    this.onDelete = this.onDelete.bind(this)
    this.onEditDone = this.onEditDone.bind(this)
  }

  componentWillMount() {
    const {message, myId, saveMessage, index} = this.props

    if (!message.id && message.userId === myId) {
      saveMessage({...message, content: cleanStringWithURL(message.content)}, index)
    }
  }

  render() {
    const {
      message: {
        id: messageId,
        userId,
        profilePicId,
        username,
        timeStamp,
        content
      },
      style,
      myId
    } = this.props
    const {onEdit, confirmModalShown} = this.state
    return (
      <div
        className="media"
        style={{
          minHeight: '64px',
          height: 'auto',
          width: '100%'
        }}
      >
        <ProfilePic size='4' userId={userId} profilePicId={profilePicId} />
        <div
          className="media-body"
          style={{
            width: '100%',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        >
          {!!messageId && myId === userId && !onEdit &&
            <SmallDropdownButton
              shape="button"
              icon="pencil"
              style={{
                position: 'absolute',
                opacity: 0.7,
                right: '2%'
              }}
              menuProps={[
                {
                  label: 'Edit',
                  onClick: () => this.setState({onEdit: true})
                },
                {
                  label: 'Remove',
                  onClick: () => this.setState({confirmModalShown: true})
                }
              ]}
            />
          }
          <h5 className="media-heading" style={{position: 'absolute'}}>
            <UsernameText
              user={{
                id: userId,
                name: username || '(Deleted)'
              }} /> <small>{moment.unix(timeStamp).format('LLL')}</small>
          </h5>
          <div style={{paddingTop: '1.5em'}}>
            {onEdit ?
              <EditTextArea
                autoFocus
                rows={2}
                marginTop="0px"
                text={cleanStringWithURL(content)}
                onCancel={() => this.setState({onEdit: false})}
                onEditDone={this.onEditDone}
              /> :
              <span style={style} dangerouslySetInnerHTML={{__html: content}}></span>
            }
          </div>
        </div>
        {confirmModalShown &&
          <ConfirmModal
            onHide={() => this.setState({confirmModalShown: false})}
            title="Remove Message"
            onConfirm={this.onDelete}
          />
        }
      </div>
    )
  }

  onDelete() {
    const {onDelete, message: {id: messageId}} = this.props
    onDelete(messageId).then(
      () => this.setState({confirmModalShown: false})
    )
  }

  onEditDone(editedMessage) {
    const {onEditDone, message} = this.props
    onEditDone({editedMessage, messageId: message.id}).then(
      () => this.setState({onEdit: false})
    )
  }
}
