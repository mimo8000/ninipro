package com.ninipro.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;

/** Dumps the real crash reason to a file the user can open with a file manager. */
public class AppExceptionHandler implements Thread.UncaughtExceptionHandler {
    private final Context context;
    private final Thread.UncaughtExceptionHandler previous;

    public AppExceptionHandler(Context context) {
        this.context = context;
        this.previous = Thread.getDefaultUncaughtExceptionHandler();
    }

    @Override
    public void uncaughtException(Thread thread, Throwable ex) {
        try {
            StringWriter sw = new StringWriter();
            ex.printStackTrace(new PrintWriter(sw));
            String full = sw.toString();

            // Internal + external copies so a file manager can read it.
            write(new File(context.getFilesDir(), "crash.log"), full);
            File ext = context.getExternalFilesDir(null);
            if (ext != null) write(new File(ext, "crash.log"), full);

            final String shown = "خطای NiniPro:\n"
                    + (full.length() > 400 ? full.substring(0, 400) : full);
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    Toast.makeText(context, shown, Toast.LENGTH_LONG).show();
                } catch (Throwable ignored) {
                }
            });
            try { Thread.sleep(2000); } catch (InterruptedException ignore) { }
        } catch (Throwable t) {
            Log.e("NiniPro", "handler failed", t);
        }
        if (previous != null) previous.uncaughtException(thread, ex);
        else System.exit(1);
    }

    private void write(File f, String body) {
        try (FileWriter w = new FileWriter(f, true)) {
            w.write("==== crash " + System.currentTimeMillis() + " ====\n");
            w.write(body);
            w.write("\n");
        } catch (Exception ignored) {
        }
    }
}
