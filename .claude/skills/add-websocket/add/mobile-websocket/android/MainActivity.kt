package com.nanoclaw.example

import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.random.Random

/**
 * WebSocket client for connecting to NanoClaw from Android
 *
 * Add to build.gradle:
 * implementation("com.squareup.okhttp3:okhttp:4.12.0")
 */
class NanoClawClient(
    private val serverUrl: String = "ws://localhost:9876"
) {
    private val TAG = "NanoClaw"

    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .pingInterval(30, TimeUnit.SECONDS)
        .build()

    private var deviceId: String = ""
    private var isPaired = false

    // Callbacks
    var onMessage: ((String) -> Unit)? = null
    var onPairingCode: ((String) -> Unit)? = null
    var onConnected: (() -> Unit)? = null
    var onDisconnected: (() -> Unit)? = null
    var onError: ((String) -> Unit)? = null

    /**
     * Initialize with a device ID (persists across app restarts)
     */
    fun initialize(deviceId: String) {
        this.deviceId = deviceId
    }

    /**
     * Generate a new random device ID
     */
    fun generateDeviceId(): String {
        return "android-${System.currentTimeMillis()}-${Random.nextInt(10000)}"
    }

    fun connect() {
        val request = Request.Builder()
            .url(serverUrl)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "Connected to NanoClaw")
                onConnected?.invoke()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(1000, null)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "Disconnected: $reason")
                isPaired = false
                onDisconnected?.invoke()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Error: ${t.message}")
                onError?.invoke(t.message ?: "Unknown error")
            }
        })
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnected")
        webSocket = null
        isPaired = false
    }

    fun sendMessage(content: String) {
        if (!isPaired) {
            onError?.invoke("Not paired")
            return
        }

        val json = JSONObject().apply {
            put("type", "message")
            put("content", content)
        }

        webSocket?.send(json.toString())
    }

    fun requestPairing() {
        if (deviceId.isEmpty()) {
            onError?.invoke("Device ID not set")
            return
        }

        val json = JSONObject().apply {
            put("type", "pairing_request")
            put("deviceId", deviceId)
        }

        webSocket?.send(json.toString())
    }

    fun verifyPairing(code: String) {
        if (deviceId.isEmpty()) {
            onError?.invoke("Device ID not set")
            return
        }

        val json = JSONObject().apply {
            put("type", "pairing_verify")
            put("deviceId", deviceId)
            put("pairingCode", code.uppercase())
        }

        webSocket?.send(json.toString())
    }

    private fun sendJson(json: JSONObject) {
        webSocket?.send(json.toString())
    }

    private fun handleMessage(text: String) {
        try {
            val json = JSONObject(text)
            val type = json.getString("type")

            when (type) {
                "pairing_challenge" -> {
                    val code = json.optString("pairingCode", "")
                    if (code.isNotEmpty()) {
                        onPairingCode?.invoke(code)
                    }
                }

                "pairing_success" -> {
                    isPaired = true
                    Log.d(TAG, "Paired successfully")
                }

                "pairing_failed" -> {
                    val message = json.optString("message", "Pairing failed")
                    onError?.invoke(message)
                }

                "message" -> {
                    val content = json.optString("content", "")
                    if (content.isNotEmpty()) {
                        onMessage?.invoke(content)
                    }
                }

                "pong" -> {
                    // Keep-alive response
                }

                "error" -> {
                    val message = json.optString("message", "Unknown error")
                    onError?.invoke(message)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse message: ${e.message}")
        }
    }
}

// MARK: - Example Usage
/*
class MainActivity : AppCompatActivity() {

    private lateinit var nanoClaw: NanoClawClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize with stored device ID or generate new one
        val prefs = getSharedPreferences("nanoclaw", MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)

        if (deviceId == null) {
            deviceId = "android-${System.currentTimeMillis()}"
            prefs.edit().putString("device_id", deviceId).apply()
        }

        nanoClaw = NanoClawClient("ws://192.168.1.x:9876") // Replace with your NanoClaw IP
        nanoClaw.initialize(deviceId)

        // Set up callbacks
        nanoClaw.onConnected = {
            Log.d("NanoClaw", "Connected")
            // Request pairing if not paired
            nanoClaw.requestPairing()
        }

        nanoClaw.onPairingCode = { code ->
            Log.d("NanoClaw", "Pairing code: $code")
            // Show dialog for user to confirm
            showPairingDialog(code)
        }

        nanoClaw.onMessage = { message ->
            Log.d("NanoClaw", "Received: $message")
            runOnUiThread {
                // Update UI
            }
        }

        nanoClaw.onError = { error ->
            Log.e("NanoClaw", "Error: $error")
        }

        // Connect
        nanoClaw.connect()
    }

    private fun showPairingDialog(code: String) {
        AlertDialog.Builder(this)
            .setTitle("Pairing Code")
            .setMessage("Enter this code in NanoClaw: $code")
            .setPositiveButton("OK") { _, _ ->
                // User confirms - wait for pairing success
            }
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        nanoClaw.disconnect()
    }

    // Send message example
    fun onSendMessage(view: View) {
        val input = findViewById<EditText>(R.id.message_input)
        nanoClaw.sendMessage(input.text.toString())
    }
}
*/
