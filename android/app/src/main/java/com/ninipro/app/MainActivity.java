package com.ninipro.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.ninipro.app.vpn.NiniVpnPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the native VPN plugin before the bridge is created.
        initialPlugins.add(NiniVpnPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
