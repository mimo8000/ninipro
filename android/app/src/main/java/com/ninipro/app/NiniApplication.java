package com.ninipro.app;

import android.app.Application;

public class NiniApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        // Surface real crash reasons instead of "app has a problem".
        Thread.setDefaultUncaughtExceptionHandler(new AppExceptionHandler(this));
    }
}
