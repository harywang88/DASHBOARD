package com.gps.tracker.ui

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.launch

private val Context.dataStore by preferencesDataStore(name = "gps_settings")
private val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
private val TRACKING_ENABLED = booleanPreferencesKey("tracking_enabled")

@Composable
fun SettingsScreen(
    onBackClick: () -> Unit,
    context: Context
) {
    val scope = rememberCoroutineScope()
    var notificationsEnabled by remember { mutableStateOf(true) }
    var trackingEnabled by remember { mutableStateOf(true) }

    // Load settings saat screen dibuka
    LaunchedEffect(Unit) {
        context.dataStore.data.collect { preferences ->
            notificationsEnabled = preferences[NOTIFICATIONS_ENABLED] ?: true
            trackingEnabled = preferences[TRACKING_ENABLED] ?: true
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5))
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFFF9800))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBackClick) {
                Icon(
                    Icons.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                "Pengaturan",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Notifikasi Setting
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            "Notifikasi Aplikasi",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Aktifkan atau nonaktifkan notifikasi tracking",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }

                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { isChecked ->
                            notificationsEnabled = isChecked
                            scope.launch {
                                context.dataStore.edit { preferences ->
                                    preferences[NOTIFICATIONS_ENABLED] = isChecked
                                }
                            }
                        }
                    )
                }
            }
        }

        // Tracking Status
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            "Status Tracking",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            if (trackingEnabled) "Tracking Aktif" else "Tracking Tidak Aktif",
                            fontSize = 12.sp,
                            color = if (trackingEnabled) Color(0xFF4CAF50) else Color.Red
                        )
                    }

                    Switch(
                        checked = trackingEnabled,
                        onCheckedChange = { isChecked ->
                            trackingEnabled = isChecked
                            scope.launch {
                                context.dataStore.edit { preferences ->
                                    preferences[TRACKING_ENABLED] = isChecked
                                }
                            }
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // About Section
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    "Tentang Aplikasi",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "GPS Tracker v1.0.0",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
                Text(
                    "Aplikasi untuk tracking lokasi GPS secara real-time",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun TrackingScreen(
    onStartTracking: () -> Unit,
    onStopTracking: () -> Unit,
    context: Context
) {
    val scope = rememberCoroutineScope()
    var isTracking by remember { mutableStateOf(false) }

    // Load tracking status
    LaunchedEffect(Unit) {
        context.dataStore.data.collect { preferences ->
            isTracking = preferences[TRACKING_ENABLED] ?: true
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5F5))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Status Display
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    painter = rememberVectorPainter(image = Icons.Default.LocationOn),
                    contentDescription = "Location",
                    modifier = Modifier.size(64.dp),
                    tint = if (isTracking) Color(0xFF4CAF50) else Color.Gray
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    if (isTracking) "Tracking Aktif" else "Tracking Tidak Aktif",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isTracking) Color(0xFF4CAF50) else Color.Red
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    if (isTracking)
                        "Lokasi Anda sedang dikirim ke server"
                    else
                        "Tracking sedang dimatikan",
                    fontSize = 14.sp,
                    color = Color.Gray
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Start/Stop Button
        Button(
            onClick = {
                if (isTracking) {
                    onStopTracking()
                } else {
                    onStartTracking()
                }
                isTracking = !isTracking
                scope.launch {
                    context.dataStore.edit { preferences ->
                        preferences[TRACKING_ENABLED] = !isTracking
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isTracking) Color(0xFFFF5252) else Color(0xFF4CAF50)
            )
        ) {
            Text(
                if (isTracking) "Hentikan Tracking" else "Mulai Tracking",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.runtime.rememberVectorPainter
