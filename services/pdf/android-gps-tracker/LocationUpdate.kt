package com.gps.tracker.data

import com.google.gson.annotations.SerializedName

data class LocationUpdate(
    @SerializedName("latitude")
    val latitude: Double,
    
    @SerializedName("longitude")
    val longitude: Double,
    
    @SerializedName("accuracy")
    val accuracy: Float,
    
    @SerializedName("timestamp")
    val timestamp: String,
    
    @SerializedName("provider")
    val provider: String
)
