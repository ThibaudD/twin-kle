import React, {Component, PropTypes} from 'react'
import {reduxForm, Field} from 'redux-form'
import {Modal, Button, Alert} from 'react-bootstrap'
import {stringIsEmpty} from 'helpers/stringHelpers'

/* eslint-disable react/prop-types */
const renderInput = ({input, type, className, placeholder, meta: {touched, error}}) => (
  <div>
    <input
      {...input}
      className={className}
      placeholder={placeholder}
      type={type}
    />
    <span
      className="help-block"
      style={{color: 'red'}}
    >{touched && error && error}</span>
  </div>
)
/* eslint-enable react/prop-types */

@reduxForm({
  form: 'LoginForm',
  validate
})
export default class LoginForm extends Component {
  static propTypes = {
    handleSubmit: PropTypes.func,
    errorMessage: PropTypes.string,
    hideErrorAlert: PropTypes.func,
    loginAsync: PropTypes.func
  }

  constructor() {
    super()
    this.onSubmit = this.onSubmit.bind(this)
  }

  render() {
    const {handleSubmit, errorMessage, hideErrorAlert} = this.props
    return (
      <form onSubmit={handleSubmit(this.onSubmit)} onInput={() => hideErrorAlert()} >
        {errorMessage &&
          <Alert bsStyle="danger">
            {errorMessage}
          </Alert>
        }
        <div className="container-fluid">
          <fieldset className="form-group">
            <label>Username</label>
            <Field
              name="username"
              placeholder="Username"
              className="form-control"
              type="text"
              component={renderInput}
            />
          </fieldset>
          <fieldset className="form-group">
            <label>Password</label>
            <Field
              name="password"
              placeholder="Password"
              className="form-control"
              type="password"
              component={renderInput}
            />
          </fieldset>
        </div>
        <br />
        <Modal.Footer>
          <Button type="submit">Log In</Button>
        </Modal.Footer>
      </form>
    )
  }

  onSubmit(props) {
    this.props.loginAsync(props)
  }
}

function validate(values) {
  const {username, password} = values
  const errors = {}
  if (stringIsEmpty(username)) {
    errors.username = 'Enter username'
  }
  if (stringIsEmpty(password)) {
    errors.password = 'Enter password'
  }
  return errors
}
