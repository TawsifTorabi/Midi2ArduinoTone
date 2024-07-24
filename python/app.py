import mido
import tkinter as tk
from tkinter import filedialog, messagebox
import threading

def convert_to_arduino_tone(midi_file):
    try:
        mid = mido.MidiFile(midi_file)
        arduino_code = ["void song(int buzzerPin){", ""]

        for msg in mid.play():
            if msg.type == 'note_on' and msg.velocity > 0:
                note = msg.note
                frequency = int(440 * 2 ** ((note - 69) / 12))
                duration = int(msg.time * 1000)  # Convert seconds to milliseconds
                arduino_code.append(f"  tone(buzzerPin, {frequency});")
                arduino_code.append(f"  delay({duration});")
                arduino_code.append("  noTone(buzzerPin);")
                arduino_code.append("")

        arduino_code.append("}")
        arduino_code.append("")
        arduino_code.append("void setup() {")
        arduino_code.append("  // put your setup code here, to run once:")
        arduino_code.append("  // call the song function with digital pin")
        arduino_code.append("  song(11);")
        arduino_code.append("}")
        arduino_code.append("")
        arduino_code.append("void loop() {")
        arduino_code.append("  // put your main code here, to run repeatedly:")
        arduino_code.append("}")

        return "\n".join(arduino_code)
    
    except Exception as e:
        messagebox.showerror("Error", f"Error converting MIDI to Arduino tone code:\n{str(e)}")
        return None

def select_midi_file():
    file_path = filedialog.askopenfilename(filetypes=[("MIDI Files", "*.mid *.midi")])
    if file_path:
        threading.Thread(target=process_midi_file, args=(file_path,)).start()

def process_midi_file(file_path):
    select_button.config(state=tk.DISABLED)
    status_label.config(text=f"Processing: {file_path}")
    
    arduino_code = convert_to_arduino_tone(file_path)
    
    if arduino_code:
        output_text.delete(1.0, tk.END)
        output_text.insert(tk.END, arduino_code)
        status_label.config(text="Done")
    else:
        status_label.config(text="Error processing file")
    
    select_button.config(state=tk.NORMAL)

def copy_to_clipboard():
    root.clipboard_clear()
    root.clipboard_append(output_text.get(1.0, tk.END))
    root.update()  # Keeps the clipboard content after the window is closed
    messagebox.showinfo("Copied", "Arduino code copied to clipboard.")

# Tkinter GUI setup
root = tk.Tk()
root.title("MIDI to Arduino Tone Converter")

# Select MIDI file button
select_button = tk.Button(root, text="Select MIDI File", command=select_midi_file)
select_button.pack(pady=10)

# Status label
status_label = tk.Label(root, text="No file selected")
status_label.pack(pady=5)

# Output text area
output_text = tk.Text(root, height=20, width=60)
output_text.pack(padx=20, pady=10)

# Copy to clipboard button
copy_button = tk.Button(root, text="Copy to Clipboard", command=copy_to_clipboard)
copy_button.pack(pady=10)

# Credit
credit_label = tk.Label(root, text="Created with ❤ by Tawsif Torabi")
credit_label.pack(pady=5)

root.mainloop()
