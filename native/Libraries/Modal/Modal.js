'use strict';

const AppContainer = require('AppContainer');
const I18nManager = require('I18nManager');
const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const View = require('View');

const deprecatedPropType = require('deprecatedPropType');
const requireNativeComponent = require('requireNativeComponent');
const RCTModalHostView = requireNativeComponent('RCTModalHostView', null);
const ModalEventEmitter = Platform.OS === 'ios' && NativeModules.ModalManager ?
  new NativeEventEmitter(NativeModules.ModalManager) : null;

import type EmitterSubscription from 'EmitterSubscription';

var uniqueModalIdentifier = 0;

class Modal extends React.Component<Object> {

  static defaultProps = {
    visible: true,
    hardwareAccelerated: false,
  };

  static contextTypes = {
    rootTag: PropTypes.number,
  };

  _identifier: number;
  _eventSubscription: ?EmitterSubscription;

  constructor(props: Object) {
    super(props);
    Modal._confirmProps(props);
    this._identifier = uniqueModalIdentifier++;
  }

  componentDidMount() {
    if (ModalEventEmitter) {
      this._eventSubscription = ModalEventEmitter.addListener(
        'modalDismissed',
        event => {
          if (event.modalID === this._identifier && this.props.onDismiss) {
            this.props.onDismiss();
          }
        },
      );
    }
  }

  componentWillUnmount() {
    if (this._eventSubscription) {
      this._eventSubscription.remove();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Object) {
    Modal._confirmProps(nextProps);
  }

  static _confirmProps(props: Object) {
    if (props.presentationStyle && props.presentationStyle !== 'overFullScreen' && props.transparent) {
      console.warn(`Modal with '${props.presentationStyle}' presentation style and 'transparent' value is not supported.`);
    }
  }

  render(): React.Node {
    if (this.props.visible === false) {
      return null;
    }

    const containerStyles = {
      backgroundColor: this.props.transparent ? 'transparent' : 'white',
    };

    let animationType = this.props.animationType;
    if (!animationType) {
      // manually setting default prop here to keep support for the deprecated 'animated' prop
      animationType = 'none';
      if (this.props.animated) {
        animationType = 'slide';
      }
    }

    let presentationStyle = this.props.presentationStyle;
    if (!presentationStyle) {
      presentationStyle = 'fullScreen';
      if (this.props.transparent) {
        presentationStyle = 'overFullScreen';
      }
    }

    const innerChildren = __DEV__ ?
      ( <AppContainer rootTag={this.context.rootTag}>
          {this.props.children}
        </AppContainer>) :
      this.props.children;

    return (
      <RCTModalHostView
        animationType={animationType}
        presentationStyle={presentationStyle}
        transparent={this.props.transparent}
        hardwareAccelerated={this.props.hardwareAccelerated}
        onRequestClose={this.props.onRequestClose}
        onShow={this.props.onShow}
        identifier={this._identifier}
        style={styles.modal}
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}
        >
        <View style={[styles.container, containerStyles]}>
          {innerChildren}
        </View>
      </RCTModalHostView>
    );
  }

  // We don't want any responder events bubbling out of the modal.
  _shouldSetResponder(): boolean {
    return true;
  }
}

const side = I18nManager.isRTL ? 'right' : 'left';
const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  container: {
    position: 'absolute',
    [side] : 0,
    top: 0,
  }
});

module.exports = Modal;
