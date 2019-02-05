/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {default as BaseDevice} from '../../devices/BaseDevice';
import {default as ArchivedDevice} from '../../devices/ArchivedDevice';
import {processStore} from '../exportData';
import {IOSDevice} from '../../..';
import {FlipperDevicePlugin} from '../../plugin.js';
import type {Notification} from '../../plugin.js';
import type {ClientExport} from '../../Client.js';

class TestDevicePlugin extends FlipperDevicePlugin {
  static id = 'TestDevicePlugin';
}

function generateNotifications(
  id: string,
  title: string,
  message: string,
  severity: 'warning' | 'error',
): Notification {
  return {id, title, message, severity};
}

function generateClientIdentifier(device: BaseDevice, app: string): string {
  const {os, deviceType, serial} = device;
  const identifier = `${app}#${os}#${deviceType}#${serial}`;
  return identifier;
}

function generateClientFromDevice(
  device: BaseDevice,
  app: string,
): ClientExport {
  const {os, deviceType, serial} = device;
  const identifier = generateClientIdentifier(device, app);
  return {
    id: identifier,
    query: {app, os, device: deviceType, device_id: serial},
  };
}

test('test generateClientFromDevice helper function', () => {
  const device = new ArchivedDevice('serial', 'emulator', 'TestiPhone', 'iOS');
  const client = generateClientFromDevice(device, 'app');
  expect(client).toEqual({
    id: 'app#iOS#emulator#serial',
    query: {app: 'app', os: 'iOS', device: 'emulator', device_id: 'serial'},
  });
});

test('test generateClientIdentifier helper function', () => {
  const device = new ArchivedDevice('serial', 'emulator', 'TestiPhone', 'iOS');
  const identifier = generateClientIdentifier(device, 'app');
  expect(identifier).toEqual('app#iOS#emulator#serial');
});

test('test generateNotifications helper function', () => {
  const notification = generateNotifications('id', 'title', 'msg', 'error');
  expect(notification).toEqual({
    id: 'id',
    title: 'title',
    message: 'msg',
    severity: 'error',
  });
});

test('test processStore function for empty state', () => {
  const json = processStore([], null, {}, [], new Map());
  expect(json).toBeNull();
});

test('test processStore function for an iOS device connected', () => {
  const json = processStore(
    [],
    new ArchivedDevice('serial', 'emulator', 'TestiPhone', 'iOS'),
    {},
    [],
    new Map(),
  );
  expect(json).toBeDefined();
  // $FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {device, clients} = json;
  expect(device).toBeDefined();
  expect(clients).toEqual([]);
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {serial, deviceType, title, os} = device;
  expect(serial).toEqual('serial');
  expect(deviceType).toEqual('emulator');
  expect(title).toEqual('TestiPhone');
  expect(os).toEqual('iOS');
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {pluginStates, activeNotifications} = json.store;
  expect(pluginStates).toEqual({});
  expect(activeNotifications).toEqual([]);
});

test('test processStore function for an iOS device connected with client plugin data', () => {
  const device = new ArchivedDevice('serial', 'emulator', 'TestiPhone', 'iOS');
  const clientIdentifier = generateClientIdentifier(device, 'testapp');
  const json = processStore(
    [],
    device,
    {[clientIdentifier]: {msg: 'Test plugin'}},
    [generateClientFromDevice(device, 'testapp')],
    new Map(),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {pluginStates} = json.store;
  let expectedPluginState = {
    [clientIdentifier]: {msg: 'Test plugin'},
  };
  expect(pluginStates).toEqual(expectedPluginState);
});

test('test processStore function to have only the client for the selected device', () => {
  const selectedDevice = new ArchivedDevice(
    'serial',
    'emulator',
    'TestiPhone',
    'iOS',
  );
  const unselectedDevice = new ArchivedDevice(
    'identifier',
    'emulator',
    'TestiPhone',
    'iOS',
  );

  const unselectedDeviceClientIdentifier = generateClientIdentifier(
    unselectedDevice,
    'testapp',
  );
  const selectedDeviceClientIdentifier = generateClientIdentifier(
    selectedDevice,
    'testapp',
  );
  const selectedDeviceClient = generateClientFromDevice(
    selectedDevice,
    'testapp',
  );
  const json = processStore(
    [],
    selectedDevice,
    {
      [unselectedDeviceClientIdentifier + '#testapp']: {
        msg: 'Test plugin unselected device',
      },
      [selectedDeviceClientIdentifier + '#testapp']: {
        msg: 'Test plugin selected device',
      },
    },
    [
      selectedDeviceClient,
      generateClientFromDevice(unselectedDevice, 'testapp'),
    ],
    new Map(),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already added
  const {clients} = json;
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already added
  const {pluginStates} = json.store;
  let expectedPluginState = {
    [selectedDeviceClientIdentifier + '#testapp']: {
      msg: 'Test plugin selected device',
    },
  };
  expect(clients).toEqual([selectedDeviceClient]);
  expect(pluginStates).toEqual(expectedPluginState);
});

test('test processStore function to have multiple clients for the selected device', () => {
  const selectedDevice = new ArchivedDevice(
    'serial',
    'emulator',
    'TestiPhone',
    'iOS',
  );

  const clientIdentifierApp1 = generateClientIdentifier(
    selectedDevice,
    'testapp1',
  );
  const clientIdentifierApp2 = generateClientIdentifier(
    selectedDevice,
    'testapp2',
  );

  const client1 = generateClientFromDevice(selectedDevice, 'testapp1');
  const client2 = generateClientFromDevice(selectedDevice, 'testapp2');

  const json = processStore(
    [],
    selectedDevice,
    {
      [clientIdentifierApp1 + '#testapp1']: {
        msg: 'Test plugin App1',
      },
      [clientIdentifierApp2 + '#testapp2']: {
        msg: 'Test plugin App2',
      },
    },
    [
      generateClientFromDevice(selectedDevice, 'testapp1'),
      generateClientFromDevice(selectedDevice, 'testapp2'),
    ],
    new Map(),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already added
  const {clients} = json;
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already added
  const {pluginStates} = json.store;
  let expectedPluginState = {
    [clientIdentifierApp1 + '#testapp1']: {
      msg: 'Test plugin App1',
    },
    [clientIdentifierApp2 + '#testapp2']: {
      msg: 'Test plugin App2',
    },
  };
  expect(clients).toEqual([client1, client2]);
  expect(pluginStates).toEqual(expectedPluginState);
});

test('test processStore function for device plugin state and no clients', () => {
  // Test case to verify that device plugin data is exported even if there are no clients
  const selectedDevice = new ArchivedDevice(
    'serial',
    'emulator',
    'TestiPhone',
    'iOS',
  );
  const json = processStore(
    [],
    selectedDevice,
    {
      'serial#TestDevicePlugin': {
        msg: 'Test Device plugin',
      },
    },
    [],
    new Map([['TestDevicePlugin', TestDevicePlugin]]),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {pluginStates} = json.store;
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {clients} = json;
  let expectedPluginState = {
    'serial#TestDevicePlugin': {msg: 'Test Device plugin'},
  };
  expect(pluginStates).toEqual(expectedPluginState);
  expect(clients).toEqual([]);
});

test('test processStore function for unselected device plugin state and no clients', () => {
  // Test case to verify that device plugin data is exported even if there are no clients
  const selectedDevice = new ArchivedDevice(
    'serial',
    'emulator',
    'TestiPhone',
    'iOS',
  );
  const json = processStore(
    [],
    selectedDevice,
    {
      'unselectedDeviceIdentifier#TestDevicePlugin': {
        msg: 'Test Device plugin',
      },
    },
    [],
    new Map([['TestDevicePlugin', TestDevicePlugin]]),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {pluginStates} = json.store;
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {clients} = json;
  expect(pluginStates).toEqual({});
  expect(clients).toEqual([]);
});

test('test processStore function for notifications for selected device', () => {
  // Test case to verify that device plugin data is exported even if there are no clients
  const selectedDevice = new ArchivedDevice(
    'serial',
    'emulator',
    'TestiPhone',
    'iOS',
  );
  const client = generateClientFromDevice(selectedDevice, 'testapp1');
  const notification = generateNotifications(
    'notificationID',
    'title',
    'Notification Message',
    'warning',
  );
  const activeNotification = {
    pluginId: 'TestNotification',
    notification,
    client: client.id,
  };
  const json = processStore(
    [activeNotification],
    selectedDevice,
    {},
    [client],
    new Map([['TestDevicePlugin', TestDevicePlugin]]),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {pluginStates} = json.store;
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {clients} = json;
  expect(pluginStates).toEqual({});
  expect(clients).toEqual([client]);
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {activeNotifications} = json.store;
  expect(activeNotifications).toEqual([activeNotification]);
});

test('test processStore function for notifications for unselected device', () => {
  // Test case to verify that device plugin data is exported even if there are no clients
  const selectedDevice = new ArchivedDevice(
    'serial',
    'emulator',
    'TestiPhone',
    'iOS',
  );
  const unselectedDevice = new ArchivedDevice(
    'identifier',
    'emulator',
    'TestiPhone',
    'iOS',
  );

  const client = generateClientFromDevice(selectedDevice, 'testapp1');
  const unselectedclient = generateClientFromDevice(
    unselectedDevice,
    'testapp1',
  );
  const notification = generateNotifications(
    'notificationID',
    'title',
    'Notification Message',
    'warning',
  );
  const activeNotification = {
    pluginId: 'TestNotification',
    notification,
    client: unselectedclient.id,
  };
  const json = processStore(
    [activeNotification],
    selectedDevice,
    {},
    [client, unselectedclient],
    new Map(),
  );
  expect(json).toBeDefined();
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {pluginStates} = json.store;
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {clients} = json;
  expect(pluginStates).toEqual({});
  expect(clients).toEqual([client]);
  //$FlowFixMe Flow doesn't that its a test and the assertion for null is already done
  const {activeNotifications} = json.store;
  expect(activeNotifications).toEqual([]);
});
