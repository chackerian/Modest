/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Alert
 * @flow
 */
'use strict';

const AlertIOS = require('AlertIOS');
const NativeModules = require('NativeModules');
const Platform = require('Platform');

import type { AlertType, AlertButtonStyle } from 'AlertIOS';

export type Buttons = Array<{
  text?: string,
  onPress?: ?Function,
  style?: AlertButtonStyle,
}>;

type Options = {
  cancelable?: ?boolean,
  onDismiss?: ?Function,
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * See http://facebook.github.io/react-native/docs/alert.html
 */
class Alert {

  /**
   * Launches an alert dialog with the specified title and message.
   *
   * See http://facebook.github.io/react-native/docs/alert.html#alert
   */
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: Options,
    type?: AlertType,
  ): void {
    if (Platform.OS === 'ios') {
      if (typeof type !== 'undefined') {
        console.warn('Alert.alert() with a 5th "type" parameter is deprecated and will be removed. Use AlertIOS.prompt() instead.');
        AlertIOS.alert(title, message, buttons, type);
        return;
      }
      AlertIOS.alert(title, message, buttons);
    } else if (Platform.OS === 'android') {
      AlertAndroid.alert(title, message, buttons, options);
    }
  }
}

module.exports = Alert;
