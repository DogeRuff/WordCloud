import spacy
from collections import Counter
from wordcloud import WordCloud
import matplotlib.pyplot as plt

nlp = spacy.load("es_core_news_sm")

texto = ""

with open("text.txt", "r", encoding = "utf-8") as f:
    texto = f.read()
    print(texto)


doc = nlp(texto.lower())

terminos = []

for token in doc:
    if (
        token.pos_ in ["NOUN", "PROPN", "ADJ"]   # sustantivos, nombres propios, adjetivos
        and not token.is_stop
        and not token.is_punct
        and len(token.text) > 3
    ):
        terminos.append(token.lemma_)

frecuencias = Counter(terminos)

frecuencias.most_common(20)

wordcloud = WordCloud(
    width=1920,
    height=1080,
    background_color="black",
    colormap="viridis",
    max_words=80
).generate_from_frequencies(frecuencias)

plt.figure(figsize=(16, 9))
plt.imshow(wordcloud, interpolation="bilinear")
plt.axis("off")
plt.show()