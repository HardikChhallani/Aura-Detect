import torch
import numpy as np
import cv2

class ObjectDetector:
    def __init__(self, model_name='yolov5s', confidence=0.5):
        """Initialize YOLOv5 model"""
        self.confidence = confidence
        self.model = torch.hub.load('ultralytics/yolov5', model_name)
        
    def detect(self, frame):
        """
        Detect objects in the frame
        Returns: List of detections with class, confidence, and coordinates
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Run inference
        results = self.model(frame_rgb)
        
        # Process results
        detections = []
        for pred in results.xyxy[0].cpu().numpy():
            x1, y1, x2, y2, conf, cls = pred
            if conf > self.confidence:
                detection = {
                    'class': results.names[int(cls)],
                    'confidence': float(conf),
                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                }
                detections.append(detection)
                
        return detections
