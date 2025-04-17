from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import torch
import base64
from src.detection.detector import ObjectDetector
from src.detection.utils import format_timestamp
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# Initialize the YOLOv5 detector
detector = ObjectDetector()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect_webcam', methods=['POST'])
def detect_webcam():
    try:
        # Get the image data from the request
        image_data = request.json['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Run detection
        detections = detector.detect(frame)
        
        return jsonify({
            'success': True,
            'detections': detections,
            'timestamp': format_timestamp()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/detect_image', methods=['POST'])
def detect_image():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
            
        # Read and process the image
        in_memory_file = file.read()
        nparr = np.frombuffer(in_memory_file, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'success': False, 'error': 'Invalid image format'})
            
        # Ensure the image is not too large
        max_dimension = 1024
        height, width = frame.shape[:2]
        if width > max_dimension or height > max_dimension:
            scale = min(max_dimension/width, max_dimension/height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            frame = cv2.resize(frame, (new_width, new_height))
        
        # Run detection
        detections = detector.detect(frame)
        
        return jsonify({
            'success': True,
            'detections': detections,
            'timestamp': format_timestamp()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
