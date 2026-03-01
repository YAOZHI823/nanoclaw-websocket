import Foundation

/// WebSocket client for connecting to NanoClaw
/// Usage: Copy this file into your iOS project and call NanoClawClient.shared.connect()

class NanoClawClient: NSObject {
    static let shared = NanoClawClient()

    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession!
    private var deviceId: String
    private var isPaired = false

    // Callbacks
    var onMessage: ((String) -> Void)?
    var onPairingCode: ((String) -> Void)?
    var onConnected: (() -> Void)?
    var onDisconnected: (() -> Void)?
    var onError: ((Error) -> Void)?

    private let serverUrl: String

    private init() {
        // Load or generate device ID
        if let savedId = UserDefaults.standard.string(forKey: "nanoclaw_device_id") {
            self.deviceId = savedId
        } else {
            self.deviceId = UUID().uuidString
            UserDefaults.standard.set(deviceId, forKey: "nanoclaw_device_id")
        }

        // Default to localhost - change for actual deployment
        self.serverUrl = ProcessInfo.processInfo.environment["NANOCLAW_URL"] ?? "ws://localhost:9876"

        super.init()

        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        self.urlSession = URLSession(configuration: config, delegate: self, delegateQueue: .main)
    }

    func connect() {
        guard let url = URL(string: serverUrl) else {
            onError?(NSError(domain: "NanoClaw", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
            return
        }

        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
        onConnected?()
    }

    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isPaired = false
        onDisconnected?()
    }

    func sendMessage(_ content: String) {
        guard isPaired else {
            onError?(NSError(domain: "NanoClaw", code: -2, userInfo: [NSLocalizedDescriptionKey: "Not paired"]))
            return
        }

        let message: [String: Any] = [
            "type": "message",
            "content": content
        ]

        sendJson(message)
    }

    func requestPairing() {
        let message: [String: Any] = [
            "type": "pairing_request",
            "deviceId": deviceId
        ]

        sendJson(message)
    }

    func verifyPairing(code: String) {
        let message: [String: Any] = [
            "type": "pairing_verify",
            "deviceId": deviceId,
            "pairingCode": code.uppercased()
        ]

        sendJson(message)
    }

    private func sendJson(_ dict: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let jsonString = String(data: data, encoding: .utf8) else {
            return
        }

        let message = URLSessionWebSocketTask.Message.string(jsonString)
        webSocketTask?.send(message) { [weak self] error in
            if let error = error {
                self?.onError?(error)
            }
        }
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                self?.receiveMessage()

            case .failure(let error):
                self?.onError?(error)
                self?.onDisconnected?()
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }

        switch type {
        case "pairing_challenge":
            if let code = json["pairingCode"] as? String {
                onPairingCode?(code)
            }

        case "pairing_success":
            isPaired = true

        case "pairing_failed":
            if let message = json["message"] as? String {
                onError?(NSError(domain: "NanoClaw", code: -3, userInfo: [NSLocalizedDescriptionKey: message]))
            }

        case "message":
            if let content = json["content"] as? String {
                onMessage?(content)
            }

        case "pong":
            // Keep-alive response
            break

        case "error":
            if let message = json["message"] as? String {
                onError?(NSError(domain: "NanoClaw", code: -4, userInfo: [NSLocalizedDescriptionKey: message]))
            }

        default:
            break
        }
    }

    // Keep-alive ping every 30 seconds
    func startPingTimer() {
        Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.sendJson(["type": "ping"])
        }
    }
}

// MARK: - URLSessionWebSocketDelegate
extension NanoClawClient: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        onConnected?()
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        onDisconnected?()
    }
}

// MARK: - Example Usage
/*
 // In your ViewController or AppDelegate:

 NanoClawClient.shared.onConnected = {
     print("Connected to NanoClaw")
 }

 NanoClawClient.shared.onPairingCode = { code in
     print("Enter this code in NanoClaw: \(code)")
     // Show alert to user asking for code confirmation
 }

 NanoClawClient.shared.onMessage = { message in
     print("Received: \(message)")
     // Update UI with response
 }

 NanoClawClient.shared.onError = { error in
     print("Error: \(error.localizedDescription)")
 }

 NanoClawClient.shared.connect()
 NanoClawClient.shared.startPingTimer()

 // After user enters pairing code:
 // NanoClawClient.shared.verifyPairing(code: "ABCD12")

 // Send a message:
 // NanoClawClient.shared.sendMessage("Hello!")
*/
