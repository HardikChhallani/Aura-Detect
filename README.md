# AuraDetect – Real-time Object Detection Hub

AuraDetect is a cutting-edge web application that delivers real-time object detection using YOLOv5. Developed by **Hardik Chhallani** (GitHub: [HardikChhallani](https://github.com/HardikChhallani)), this project combines a Flask backend, OpenCV, and PyTorch with a cyberpunk-themed frontend.

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Author](#author)
- [License](#license)

## Features

- **Real-time Webcam Detection**: Stream video from your webcam and detect objects on-the-fly.
- **Image Upload Detection**: Analyze any image by uploading it through the UI.
- **Detection Logs**: Each detection is timestamped and displayed in a live log panel.
- **Export Logs**: Download detection history as a JSON file.
- **Cyberpunk UI**: Futuristic glassmorphism design with neon accents.
- **YOLOv5 Powered**: Fast and accurate object detection with pretrained YOLOv5 models.

## Project Structure

```
Aura Detect/
├── app.py                  # Flask app entrypoint
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── src/
│   ├── detection/
│   │   ├── detector.py     # YOLOv5 detection logic
│   │   └── utils.py        # Timestamp formatting
│   ├── static/
│   │   ├── css/style.css   # Stylesheet
│   │   └── js/main.js      # Frontend scripts
│   ├── templates/
│   │   └── index.html      # Main HTML UI
│   └── yolov5s.pt          # YOLOv5 model weights
```

## Setup Instructions

1. **Clone the repository**
   ```powershell
   git clone <repo-url>
   cd "Aura Detect"
   ```
2. **Create and activate a virtual environment**
   ```powershell
   python -m venv venv
   venv\Scripts\activate    # On Windows
   # Or: source venv/bin/activate    # On Linux/Mac
   ```
3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```
4. **Run the application**
   ```powershell
   python app.py
   ```
5. **Open in browser**
   Navigate to [http://localhost:5000](http://localhost:5000)

## Usage

- **Webcam Detection**: Click **Start Webcam** to begin live detection.
- **Image Detection**: Use the **Upload Image** button to select and analyze an image.
- **View Logs**: Monitor the detection log panel. Click **Export Logs** to download the log file.

## Tech Stack

- **Backend**: Flask, OpenCV, PyTorch, YOLOv5
- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **UI Theme**: Cyberpunk/Futuristic (glassmorphism)

## Author

**Hardik Chhallani** – GitHub: [HardikChhallani](https://github.com/HardikChhallani)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.