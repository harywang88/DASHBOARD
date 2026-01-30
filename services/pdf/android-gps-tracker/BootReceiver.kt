package com.gps.tracker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.gps.tracker.service.LocationTrackingService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val serviceIntent = Intent(context, LocationTrackingService::class.java)
            context.startService(serviceIntent)
        }
    }
}
