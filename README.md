# MSLAT (Malayalam Sign Language Alphabet Translator)

A real-time Malayalam Sign Language recognition system built using MediaPipe, TensorFlow/Keras LSTM networks, and Eel (HTML/JS/CSS frontend).

---

## Demo Video
- [Real Time Detection Demo](https://drive.google.com/file/d/1UwdVFWxeFcZNSKn_Pkwmd2C8H0xOMlBe/view?usp=sharing)

---

## Screenshots

### Front-Page
![Front-Page](https://raw.githubusercontent.com/Midhun-7/MSLAT/master/Front%20Page.png)

### Dictionary-Page
![Dictionary-Page](https://github.com/Midhun-7/MSLAT/blob/master/Dictionary.png)

### Results-Page
![Results-Page](https://github.com/Midhun-7/MSLAT/blob/master/Result.png)

---

## Getting Started Locally

### Prerequisites
- **Python 3.9** (Recommended)
- A working webcam

---

### Step 1: Create and Activate a Virtual Environment

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

---

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

---

### Step 3: Run the Application
Run the live translation app with the trained model:
```bash
python live.py model
```

1. A browser window will open displaying the **Landing Page**.
2. Click **"Explore !"** to navigate to the **Home** translator view.
3. Click the **"Start"** button to activate your webcam and start live sign detection.
4. When finished, click **"Stop"** to stop the camera.

---

### Alternative: CLI / OpenCV Window Only
If you prefer running without the web browser interface:
```bash
python live_cmd.py model
```
