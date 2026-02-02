package com.gps.tracker

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.gps.tracker.service.LocationTrackingService
import com.gps.tracker.ui.SettingsScreen
import com.gps.tracker.ui.TrackingScreen
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false -> {
                startTrackingService()
            }
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false -> {
                startTrackingService()
            }
            else -> {
                // Permission denied
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            GpsTrackerApp(
                onStartTracking = { startTracking() },
                onStopTracking = { stopTracking() },
                context = this
            )
        }

        requestPermissions()
    }

    private fun requestPermissions() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED -> {
                startTrackingService()
            }
            else -> {
                locationPermissionRequest.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.ACCESS_BACKGROUND_LOCATION
                    )
                )
            }
        }

        // Notification permission untuk Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissions(
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    1
                )
            }
        }
    }

    private fun startTracking() {
        val intent = Intent(this, LocationTrackingService::class.java)
        startService(intent)
    }

    private fun stopTracking() {
        val intent = Intent(this, LocationTrackingService::class.java)
        stopService(intent)
    }
}

@Composable
fun GpsTrackerApp(
    onStartTracking: () -> Unit,
    onStopTracking: () -> Unit,
    context: MainActivity
) {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Tracking) }

    MaterialTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            "GPS Tracker",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    actions = {
                        IconButton(
                            onClick = { currentScreen = Screen.Settings }
                        ) {
                            Icon(
                                Icons.Filled.Settings,
                                contentDescription = "Settings"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFFFF9800)
                    )
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentScreen) {
                    Screen.Tracking -> {
                        TrackingScreen(
                            onStartTracking = onStartTracking,
                            onStopTracking = onStopTracking,
                            context = context
                        )
                    }
                    Screen.Settings -> {
                        SettingsScreen(
                            onBackClick = { currentScreen = Screen.Tracking },
                            context = context
                        )
                    }
                }
            }
        }
    }
}

sealed class Screen {
    object Tracking : Screen()
    object Settings : Screen()
}
