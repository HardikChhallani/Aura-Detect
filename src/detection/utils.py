from datetime import datetime

def format_timestamp():
    """Return formatted timestamp for detection logs"""
    return datetime.now().strftime("%H:%M:%S")
