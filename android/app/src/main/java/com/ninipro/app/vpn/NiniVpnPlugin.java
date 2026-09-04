package com.ninipro.app.vpn;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.CopyOnWriteArrayList;

@CapacitorPlugin(name = "NiniVpn")
public class NiniVpnPlugin extends Plugin {

    public static final CopyOnWriteArrayList<NiniVpnBridgeListener> listeners = new CopyOnWriteArrayList<>();

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

    @PluginMethod
    public void connect(PluginCall call) {
        String config = call.getString("config");
        if (config == null || config.isEmpty()) {
            call.reject("config required");
            return;
        }
        Context ctx = getContext();
        NiniVpnService.connect(ctx, config);
        JSObject ret = new JSObject();
        ret.put("status", "connecting");
        call.resolve(ret);
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
