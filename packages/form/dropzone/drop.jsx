import React, { Component } from 'react';

class Dropzone extends Component {

  allowDrop = (event) => {
    $(".dropzone").addClass("highlighted-drop");
    event.preventDefault();
  }

  openDrop() {
    $(".fileDropper").click();
  }

  removeColor = (event) => {
    $(".dropzone").removeClass("highlighted-drop");
  }

  dropped = (event) => {
    event.preventDefault();
    let dataTransferItemsList = []
    if (event.dataTransfer) {
      console.log('holly', event.dataTransfer);
      const dt = event.dataTransfer
      if (dt.files && dt.files.length) {
        dataTransferItemsList = dt.files
      } else if (dt.items && dt.items.length) {
        dataTransferItemsList = dt.items
      }
    } 

    if (event.target && event.target.files) {
      dataTransferItemsList = event.target.files
      console.log('bolly', event.target.files);
    }
  }

  // if(extension.match(/(jpeg|jpg|png)/) > 0 && size > 2000) {
  
  // }

  render() {
    return (
      <div
        className='dropzone'
        onClick={this.openDrop}
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
