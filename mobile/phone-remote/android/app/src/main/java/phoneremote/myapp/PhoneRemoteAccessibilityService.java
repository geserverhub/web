package phoneremote.myapp;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.os.Build;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityEvent;
import org.json.JSONObject;

public class PhoneRemoteAccessibilityService extends AccessibilityService {
    private static PhoneRemoteAccessibilityService instance;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // gestures only
    }

    @Override
    public void onInterrupt() {
        // no-op
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    public static boolean isRunning() {
        return instance != null;
    }

    public static boolean dispatch(JSONObject action) {
        PhoneRemoteAccessibilityService svc = instance;
        if (svc == null || action == null) return false;
        return svc.handleAction(action);
    }

    private boolean handleAction(JSONObject action) {
        String type = action.optString("t", "");
        float x = (float) action.optDouble("x", 0.5);
        float y = (float) action.optDouble("y", 0.5);
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        float px = x * metrics.widthPixels;
        float py = y * metrics.heightPixels;

        switch (type) {
            case "tap":
                return dispatchTap(px, py);
            case "down":
            case "move":
                return true;
            case "up":
                return dispatchTap(px, py);
            case "scroll": {
                float dy = (float) action.optDouble("dy", 1);
                return dispatchSwipe(px, py, px, py - dy * metrics.heightPixels * 0.15f, 250);
            }
            case "key":
                return dispatchKey(action.optString("k", ""));
            case "text":
                return dispatchText(action.optString("v", ""));
            default:
                return false;
        }
    }

    private boolean dispatchTap(float x, float y) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false;
        Path path = new Path();
        path.moveTo(x, y);
        GestureDescription.StrokeDescription stroke =
            new GestureDescription.StrokeDescription(path, 0, 50);
        GestureDescription gesture =
            new GestureDescription.Builder().addStroke(stroke).build();
        return dispatchGesture(gesture, null, null);
    }

    private boolean dispatchSwipe(float x1, float y1, float x2, float y2, long durationMs) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false;
        Path path = new Path();
        path.moveTo(x1, y1);
        path.lineTo(x2, y2);
        GestureDescription.StrokeDescription stroke =
            new GestureDescription.StrokeDescription(path, 0, durationMs);
        GestureDescription gesture =
            new GestureDescription.Builder().addStroke(stroke).build();
        return dispatchGesture(gesture, null, null);
    }

    private boolean dispatchKey(String key) {
        if ("Escape".equals(key)) {
            return performGlobalAction(GLOBAL_ACTION_BACK);
        }
        if ("Home".equals(key)) {
            return performGlobalAction(GLOBAL_ACTION_HOME);
        }
        if ("Backspace".equals(key)) {
            AccessibilityNodeInfo focused = findFocusedInput();
            if (focused != null) {
                CharSequence text = focused.getText();
                if (text != null && text.length() > 0) {
                    Bundle args = new Bundle();
                    args.putCharSequence(
                        AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                        text.subSequence(0, text.length() - 1)
                    );
                    return focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
                }
            }
            return performGlobalAction(GLOBAL_ACTION_BACK);
        }
        if ("Enter".equals(key)) {
            AccessibilityNodeInfo focused = findFocusedInput();
            if (focused != null) {
                return focused.performAction(AccessibilityNodeInfo.ACTION_CLICK);
            }
        }
        return false;
    }

    private boolean dispatchText(String text) {
        if (text == null || text.isEmpty()) return false;
        AccessibilityNodeInfo focused = findFocusedInput();
        if (focused == null) return false;
        CharSequence current = focused.getText();
        String next = current == null ? text : current.toString() + text;
        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, next);
        return focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
    }

    private AccessibilityNodeInfo findFocusedInput() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return null;
        AccessibilityNodeInfo focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focused != null) return focused;
        return root.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
    }
}
