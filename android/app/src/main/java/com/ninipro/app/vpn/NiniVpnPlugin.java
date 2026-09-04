package com.ninipro.app.vpn;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.CopyOnWriteArrayList;

@CapacitorPlugin(name = "NiniVpn")
public class NiniVpnPlugin extends Plugin {

    public static final CopyOnWriteArrayList<NiniVpnBridgeListener> listeners = new CopyOnWriteArrayList<>();
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

    @ActivityCallback
    private void handleVpnPermission(PluginCall call, ActivityResult result) {
        if (call == null) return;
        int code = result.getResultCode();
        if (code == Activity.RESULT_OK && pendingConfig != null) {
            Context ctx = getContext();
            NiniVpnService.connect(ctx, pendingConfig);
            call.resolve(new JSObject().put("status", "connecting"));
        } else {
            call.reject("VPN permission denied");
            NiniVpnBridge.emit("error:VPN permission denied");
        }
        pendingConfig = null;
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String config = call.getString("config");
        if (config == null || config.isEmpty()) {
            call.reject("config required");
            return;
        }
        // Capacitor plugin methods run on a BACKGROUND thread; the VPN consent
        // dialog (startActivityForResult) MUST be launched from the UI thread,
        // otherwise an uncaught exception kills the whole app.
        final String cfg = config;
        getActivity().runOnUiThread(() -> {
            Activity activity = getActivity();
            Intent prepare = VpnService.prepare(activity);
            if (prepare == null) {
                // Already granted.
                NiniVpnService.connect(activity, cfg);
                call.resolve(new JSObject().put("status", "connecting"));
                return;
            }
            // Ask the user via the system VPN consent dialog.
            pendingConfig = cfg;
            startActivityForResult(call, prepare, "handleVpnPermission");
        });
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
