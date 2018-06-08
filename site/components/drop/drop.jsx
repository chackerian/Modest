import React, { Component } from 'react';

class Dropzone extends Component {

  allowDrop = (event) => {
    event.preventDefault();
    $(".dropzone").addClass("highlighted-drop")
  }

  removeColor = (event) => {
    $(".dropzone").removeClass("highlighted-drop")
  }

  dropped = (event) => {
  event.preventDefault();
    let dataTransferItemsList = []
    if (event.dataTransfer) {
      const dt = event.dataTransfer
      if (dt.files && dt.files.length) {
        dataTransferItemsList = dt.files
      } else if (dt.items && dt.items.length) {
        dataTransferItemsList = dt.items
      }
    }
  }

  render() {
    return (
      <div
        className='dropzone'
        onClick={(event) => this.dropped(event)}
        onDragOver={(event) => this.allowDrop(event)}
        onDragEnter={(event) => this.dropped(event)}
        onDrop={(event) => this.dropped(event)}
        onDragLeave={this.removeColor}
      >
      <input className='fileDropper' type="file" /><p>Drop images here or click to select</p>
      </div>
    )
  }

}

export default Dropzone
