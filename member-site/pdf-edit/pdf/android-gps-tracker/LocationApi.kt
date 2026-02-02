package com.gps.tracker.api

import android.content.Context
import com.google.gson.Gson
import com.gps.tracker.data.LocationUpdate
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface LocationApiService {
    @POST("api/location/update")
    suspend fun updateLocation(@Body location: LocationUpdate)
}

class LocationApi private constructor(private val service: LocationApiService) {
    
    suspend fun updateLocation(location: LocationUpdate) {
        service.updateLocation(location)
    }

    companion object {
        private const val BASE_URL = "http://your-backend-api.com/" // Ganti dengan URL backend Anda
        private var instance: LocationApi? = null

        fun create(context: Context): LocationApi {
            return instance ?: synchronized(this) {
                val logging = HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                }

                val httpClient = OkHttpClient.Builder()
                    .addInterceptor(logging)
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(15, TimeUnit.SECONDS)
                    .build()

                val retrofit = Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create(Gson()))
                    .client(httpClient)
                    .build()

                val service = retrofit.create(LocationApiService::class.java)
                LocationApi(service).also { instance = it }
            }
        }
    }
}
