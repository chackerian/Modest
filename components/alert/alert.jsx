import React, { Component } from 'react';

import { Meteor } from 'meteor/meteor';
import { connect } from 'react-redux';

class Alert extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    if (this.props.status == "alert") {
      return (
        <div className="fall">
          <span>{this.props.message="Listing Created Successfully"}</span>
        </div>
      )
    } else {
      return null
    }
  }

}

const mapStateToProps = state => {
  return {
    status: state.status
  };
}

export default connect(mapStateToProps, null)(Alert)
