import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { connect } from 'react-redux';

class NameModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      modaltab: 1,
      types: []
    }
  }

  nextPage(event) {
    var next = parseInt(event.target.getAttribute('data-step'))+1
    this.setState({
      modaltab: next
    })
  }

  backPage(event) {
    var past = parseInt(event.target.getAttribute('data-step'))-1
    this.setState({
      modaltab: past
    })
  }

  render() {
    if (this.state.modaltab == 1) {
      return(
          <div className="modal-dialog">
            <div className="modAddListingContent modal-content">
              <div>
                <div className='modal-header'>Add Listing</div>
                <div className="modal-close"><a className="close" onClick={this.props.close}><i className="material-icons">close</i></a></div>
              </div>
              <div className="modAddListingDiv modal-body step-1">
                <div className="modAddListingPage">
                  <ul className="modAddListingPageOneUl modOfferRequestPageOneUl">
                    <li className="modOfferRequestOfferWrap">
                      <h3 className="listing_title">What Are You Selling?</h3>
                      <input type="text" className="listtitle" placeholder="Listing Title" maxLength="30" data-key="listing_title" value={this.state.listing_title} onChange={(event) => this.handleChange(event)} />
                    </li>
                    <li className="modOfferRequestOfferWrap">
                      <h3 className="price">At What Price?</h3>
                      <input type="text" className="listprice" placeholder="Price" maxLength="5" data-key="price" value={this.state.price} onChange={(event) => this.handleChange(event)} />
                    </li>
                  </ul>
                </div>
                <div className="modMultiBtn modMultiBtnSingle">
                    <button type="button" className="modalNext" data-step="1" onClick={(event) => this.nextPage(event)}>Next</button>
                </div>
              </div>
            </div>
          </div>
      )
    }

  }

}

const mapDispatchToProps = dispatch => {
  return {
      close: () => dispatch({type: 'CLOSE'})
  };
};

export default connect(null, mapDispatchToProps)(AddModal)
