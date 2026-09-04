package com.ninipro.app;

import android.app.Application;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;

/** Dumps the real crash reason to a file so we can see why the app dies on Connect. */
public class AppExceptionHandler implements Thread.UncaughtExceptionHandler {
    private final android.content.Context context;
    private final Thread.UncaughtExceptionHandler previous;

    public AppExceptionHandler(android.content.Context context) {
        this.context = context;
        this.previous = Thread.getDefaultUncaughtExceptionHandler();
    }

    @Override
    public void uncaughtException(Thread thread, Throwable ex) {
        try {
            StringWriter sw = new StringWriter();
            ex.printStackTrace(new PrintWriter(sw));
            String full = sw.toString();
            // Save to app files for inspection
            File f = new File(context.getFilesDir(), "crash.log");
            try (FileWriter w = new FileWriter(f, true)) {
                w.write("==== crash " + System.currentTimeMillis() + " ====\n");
                w.write(full);
                w.write("\n");
            } catch (Exception ignored) {}
            final String shown = "خطای NiniPro:\n" + (full.length() > 500 ? full.substring(full.length() - 500) : full);
            new Handler(Looper.getMainLooper()).post(() ->
                    Toast.makeText(context, shown, Toast.LENGTH_LONG).show());
            try { Thread.sleep(2500); } catch (InterruptedException ignore) {}
        } catch (Throwable t) {
            Log.e("NiniPro", "handler failed", t);
        }
        if (previous != null) previous.uncaughtException(thread, ex);
        else System.exit(1);
    }
}
