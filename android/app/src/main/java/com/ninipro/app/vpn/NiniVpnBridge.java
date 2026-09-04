package com.ninipro.app.vpn;

public class NiniVpnBridge {
    private static NiniVpnPlugin.NiniVpnBridgeListener listener;

    public static void setBridgeListener(NiniVpnPlugin.NiniVpnBridgeListener l) {
        listener = l;
    }

    public static void emit(String event) {
        if (listener != null) {
            listener.onEvent(event);
        }
    }
}
