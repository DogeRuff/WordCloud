# Dynamic Word Cloud

An animated word cloud built with **Python**, **Flask**, **spaCy**, and **HTML5 Canvas**. The application performs Natural Language Processing (NLP) on Spanish text, generates weighted concepts, and displays them in an animated visualization suitable for dashboards and institutional graphic devices.

---

## Features

- Real-time speech transcription (Web Speech API)
- NLP preprocessing using spaCy
- Lemmatization of Spanish text
- Automatic stop-word filtering
- Animated HTML5 Canvas visualization
- Cached processing using `palabras.json`
- Responsive web interface
- Designed for large-format displays and video walls

---

## Requirements

It is recommended to use **Anaconda** (or **Miniconda**) to create an isolated Python environment.

### Create the environment

```bash
conda create -n wordcloud python=3.12.13
```

Activate it:

```bash
conda activate wordcloud
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/<your-user>/<your-repository>.git
```

Enter the project folder:

```bash
cd <your-repository>
```

Install the required Python packages:

```bash
python -m pip install -r requirements.txt
```

Download the Spanish NLP model:

```bash
python -m spacy download es_core_news_sm
```

---

## Running the application

Start the Flask server:

```bash
python app.py
```

Open your browser at:

```
http://localhost:5000
```

---

## Project Structure

```text
.
├── app.py
├── requirements.txt
├── data/
│   ├── texto.txt
│   └── palabras.json
├── static/
│   ├── app.js
│   └── styles.css
└── templates/
    └── index.html
```

---

## Technologies

- Python 3.12.13
- Flask
- spaCy
- HTML5 Canvas
- JavaScript
- CSS3

---

## License

This project is currently provided for educational and research purposes.

You are free to modify and adapt the source code for personal or academic use.

If you plan to redistribute or incorporate this project into another work, please include proper attribution to the original repository.

Future releases may include a formal open-source license (MIT or Apache 2.0).

---

## Author

Developed as part of a research and visualization initiative for institutional data analysis and interactive video wall applications.