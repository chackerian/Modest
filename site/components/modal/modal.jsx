import React, { Component } from 'react';
import { connect } from 'react-redux';

class Modal extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    if (this.props.status == "on") {
      $(".modal-backdrop").remove()
      $("body").append("<div class='modal-backdrop'></div>");
      $("body").css("overflow", "hidden")
      if (this.props.modal == ) {
        return <AddModal />
      }
    } else {
        $(".modal-backdrop").remove();
        $("body").css("overflow", "visible");
        return null
      }
  }

}

const mapStateToProps = state => {
  return {
    modal: state.modal,
    status: state.status
  };
}

export default connect(mapStateToProps, null)(Modal)
