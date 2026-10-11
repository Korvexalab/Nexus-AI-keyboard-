package com.aikeyboard.ime.ai

import android.content.Context
import com.aikeyboard.BuildConfig
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory

/**
 * Milestone 3.2 — Firebase App Check Configuration.
 *
 * Configures App Check for abuse prevention without creating an insecure production setup:
 * - Uses DebugAppCheckProviderFactory in debug builds (logs debug token for Firebase Console).
 * - Uses PlayIntegrityAppCheckProviderFactory in release builds (Play Integrity API).
 */
object AppCheckConfig {

    fun initialize(context: Context) {
        try {
            if (FirebaseApp.getApps(context).isNotEmpty()) {
                val appCheck = FirebaseAppCheck.getInstance()
                if (BuildConfig.DEBUG) {
                    appCheck.installAppCheckProviderFactory(
                        DebugAppCheckProviderFactory.getInstance()
                    )
                } else {
                    appCheck.installAppCheckProviderFactory(
                        PlayIntegrityAppCheckProviderFactory.getInstance()
                    )
                }
            }
        } catch (_: Throwable) {
            // App Check setup failure handled gracefully
        }
    }
}
