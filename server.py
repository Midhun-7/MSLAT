import os
os.environ.setdefault('MPLCONFIGDIR', '/tmp/matplotlib')
os.environ.setdefault('KERAS_HOME', '/tmp/keras')

import cv2
import numpy as np
import json
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import MediaPipe, Keras, and your project's holistic helpers
import mediapipe as mp
import keras
import holistic

app = FastAPI()

# -----------------------------------------------------------------
# 1. GLOBAL SCOPE: Load model & labels ONCE at server startup
# -----------------------------------------------------------------
print("⏳ Loading ML model into memory...")
model = keras.models.load_model('model')
print("✅ Model loaded successfully!")

LABELS = [None, '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62']


# -----------------------------------------------------------------
# 2. WEBSOCKET ENDPOINT: Real-time Camera & AI Pipeline
# -----------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🟢 Browser connected!")

    # TODO A: Create a 30-frame window of zeros (shape: 30 rows, 130 columns)
    window = np.zeros((30, 130))

    # Initialize MediaPipe Hands detector for this connection
    # 0.8 detection confidence matches holistic.py and prevents background false positives
    hands = mp.solutions.hands.Hands(
        min_detection_confidence=0.7,
        min_tracking_confidence=0.6,
        max_num_hands=1
    )
    active_sign = None

    try:
        while True:
            # 1. Receive binary JPEG bytes from browser canvas
            image_bytes = await websocket.receive_bytes()

            # 2. Decode raw bytes into an OpenCV BGR image
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                continue

            # 3. Mirror the frame horizontally!
            # The MSLAT neural network was trained on mirrored (selfie) webcam images.
            frame = cv2.flip(frame, 1)

            # 4. Convert BGR -> RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # 5. Run MediaPipe to detect hand landmarks
            results = hands.process(rgb_frame)
            has_hand = bool(results.multi_hand_landmarks)

            if not has_hand:
                # No hand in frame: keep confidence strictly at 0% and clear state
                window = np.zeros((30, 130))
                active_sign = None
                detected_label = None
                guess_label = None
                confidence = 0.0
                hand_box = None
            else:
                # 6. Extract & normalize landmarks (130 numbers) using holistic.py
                raw_row = holistic.to_landmark_row(results, use_holistic=False)
                features = holistic.normalize_features(raw_row)

                # 7. Shift the window up by 1 and put `features` at the bottom
                window[:-1] = window[1:]
                window[-1] = features

                # 8. Pass window through neural network (shape: 1, 30, 130)
                out = model(np.array([window]))[0].numpy()

                # 9. Find the winning prediction & confidence
                prediction = int(np.argmax(out))
                confidence = float(out[prediction])

                # 10. Extract hand bounding box
                landmarks = results.multi_hand_landmarks[0].landmark
                xs = [lm.x for lm in landmarks]
                ys = [lm.y for lm in landmarks]
                min_x = max(0.0, min(xs) - 0.04)
                max_x = min(1.0, max(xs) + 0.04)
                min_y = max(0.0, min(ys) - 0.04)
                max_y = min(1.0, max(ys) + 0.04)
                hand_box = {
                    "x": round(min_x, 3),
                    "y": round(min_y, 3),
                    "width": round(max_x - min_x, 3),
                    "height": round(max_y - min_y, 3)
                }

                guess_label = LABELS[prediction] if LABELS[prediction] is not None else None

                if confidence >= 0.45 and guess_label is not None:
                    detected_label = guess_label
                    print(f"🖐️ Hand: Sign #{detected_label} ({confidence*100:.1f}% confidence)")
                else:
                    detected_label = None
                    print(f"🤔 Hand seen: Guessing #{guess_label} ({confidence*100:.1f}%)")

            # 11. Send JSON result back to React UI over WebSocket!
            await websocket.send_text(json.dumps({
                "label": detected_label,
                "guess": guess_label,
                "confidence": round(confidence, 2),
                "box": hand_box
            }))

    except WebSocketDisconnect:
        print("🔴 Browser disconnected")
        hands.close()


# -----------------------------------------------------------------
# 3. STATIC SPA SERVING: Serve React UI from frontend/dist
# -----------------------------------------------------------------
dist_dir = Path(__file__).parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")