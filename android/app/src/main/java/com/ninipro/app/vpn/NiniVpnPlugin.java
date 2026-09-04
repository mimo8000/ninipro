package com.ninipro.app.vpn;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.CopyOnWriteArrayList;

@CapacitorPlugin(name = "NiniVpn")
public class NiniVpnPlugin extends Plugin {

    public static final CopyOnWriteArrayList<NiniVpnBridgeListener> listeners = new CopyOnWriteArrayList<>();
    public static final int VPN_PERMISSION_REQUEST = 35711;
    private PluginCall pendingCall = null;
    private String pendingConfig = null;

    interface NiniVpnBridgeListener {
        void onEvent(String event);
    }

    @Override
    public void load() {
        NiniVpnBridge.setBridgeListener(new NiniVpnBridgeListener() {
            @Override
            public void onEvent(String event) {
                JSObject ret = new JSObject();
                ret.put("event", event);
                notifyListeners("vpnEvent", ret);
            }
        });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != VPN_PERMISSION_REQUEST) return;
        if (resultCode == Activity.RESULT_OK) {
            // User granted VPN permission — start the service now.
            if (pendingConfig != null) {
                Context ctx = getContext();
                NiniVpnService.connect(ctx, pendingConfig);
                pendingCall.resolve(new JSObject().put("status", "connecting"));
            }
        } else {
            if (pendingCall != null) {
                pendingCall.reject("VPN permission denied");
            }
            NiniVpnBridge.emit("error:VPN permission denied");
        }
        pendingCall = null;
        pendingConfig = null;
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String config = call.getString("config");
        if (config == null || config.isEmpty()) {
            call.reject("config required");
            return;
        }
        Activity activity = getActivity();
        Intent prepare = VpnService.prepare(activity);
        if (prepare == null) {
            // Already granted.
            NiniVpnService.connect(activity, config);
            call.resolve(new JSObject().put("status", "connecting"));
            return;
        }
        // Need to ask the user first.
        pendingCall = call;
        pendingConfig = config;
        activity.startActivityForResult(prepare, VPN_PERMISSION_REQUEST);
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        NiniVpnService.disconnect(getContext());
        JSObject ret = new JSObject();
        ret.put("status", "disconnecting");
        call.resolve(ret);
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", NiniVpnService.getRunning());
        String err = NiniVpnService.getLastError();
        ret.put("lastError", err == null ? "" : err);
        call.resolve(ret);
    }
}
