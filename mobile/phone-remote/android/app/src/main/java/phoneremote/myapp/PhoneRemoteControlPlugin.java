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
        JSObject actionObj = call.getObject("action");
        if (actionObj == null) {
            call.reject("action required");
            return;
        }
        try {
            JSONObject action = new JSONObject(actionObj.toString());
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
}
