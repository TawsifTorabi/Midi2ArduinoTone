import webview
from flask import Flask, send_from_directory
import threading

app = Flask(__name__, static_folder='web', template_folder='web')

@app.route('/')
def index():
    return send_from_directory('web', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('web', path)

def run_flask(stop_event):
    while not stop_event.is_set():
        app.run()

if __name__ == '__main__':
    stop_event = threading.Event()
    flask_thread = threading.Thread(target=run_flask, args=(stop_event,))
    flask_thread.start()

    def on_closed():
        stop_event.set()
        flask_thread.join()
    
    window = webview.create_window('Midi2ArduinoTone v0.1.0', 'http://127.0.0.1:5000', width=830, height=900)
    webview.start(on_closed)
