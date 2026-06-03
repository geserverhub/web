package phoneremote.myapp;

import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "PhoneRemoteControl")
public class PhoneRemoteControlPlugin extends Plugin {

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", PhoneRemoteAccessibilityService.isRunning());
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void dispatch(PluginCall call) {
        try {
            JSONObject action = actionFromCall(call);
            if (action == null) {
                call.reject("action required");
                return;
            }
            if (!PhoneRemoteAccessibilityService.isRunning()) {
                call.reject("Accessibility service not enabled");
                return;
            }
            boolean ok = PhoneRemoteAccessibilityService.dispatch(action);
            if (ok) {
                call.resolve();
            } else {
                call.reject("Dispatch failed");
            }
        } catch (Exception e) {
            call.reject(e.getMessage() == null ? "Dispatch error" : e.getMessage());
        }
    }

    /** Capacitor passes flat fields (t, x, y) or legacy { action: {...} }. */
    private static JSONObject actionFromCall(PluginCall call) throws Exception {
        JSObject nested = call.getObject("action");
        if (nested != null) {
            return new JSONObject(nested.toString());
        }
        String t = call.getString("t");
        if (t == null || t.isEmpty()) {
            return null;
        }
        JSONObject action = new JSONObject();
        action.put("t", t);
        if (call.getDouble("x") != null) {
            action.put("x", call.getDouble("x"));
        }
        if (call.getDouble("y") != null) {
            action.put("y", call.getDouble("y"));
        }
        if (call.getInteger("p") != null) {
            action.put("p", call.getInteger("p"));
        }
        if (call.getDouble("dy") != null) {
            action.put("dy", call.getDouble("dy"));
        }
        String k = call.getString("k");
        if (k != null) {
            action.put("k", k);
        }
        String v = call.getString("v");
        if (v != null) {
            action.put("v", v);
        }
        return action;
    }
}
