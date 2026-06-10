from datetime import date
import time
import os
import unicodedata
from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
from openai import (
    OpenAI,
    InternalServerError,   # 503 : serveur surcharge
    APITimeoutError,       # la requete met trop de temps
    APIConnectionError,    # coupure / probleme reseau
    RateLimitError,        # 429 : quota depasse
)
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Client Gemini (endpoint compatible OpenAI) ---
client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    timeout=30.0,
    max_retries=0,
)

# --- Client Tavily (recherche web) ---
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# flash-lite = 1000 requetes/jour gratuites (flash = seulement 20/jour)
MODELE = "gemini-2.5-flash-lite"

ERREURS_TEMPORAIRES = (InternalServerError, APITimeoutError, APIConnectionError)

# Mots qui declenchent une recherche web (centres sur le rap / hip-hop)
# Ecrits SANS accent : la comparaison se fait sur du texte sans accent.
MOTS_DECLENCHEURS = [
    # sorties & musique
    "album", "mixtape", "single", "morceau", "clip", "freestyle",
    "sortie", "sorti", "drop", "nouveau", "nouvel", "dernier", "derniere",
    # collaborations
    "feat", "featuring", "collab", "collaboration", "prod",
    # rivalites
    "clash", "punchline", "rivalite",
    # chiffres & succes
    "classement", "charts", "streams", "ecoutes", "numero 1",
    "disque d'or", "disque de platine", "platine", "certification",
    # scene & artistes
    "rappeur", "rappeuse", "rappeurs", "hip-hop", "hip hop",
    "concert", "tournee", "festival",
    # actualite generale (le rap bouge vite)
    "actu", "actualite", "recent", "recemment", "maintenant",
    "2025", "2026",
]


def _sans_accents(texte):
    """Retire les accents pour une comparaison robuste (ecoutes == ecoutes)."""
    return "".join(
        c for c in unicodedata.normalize("NFD", texte)
        if unicodedata.category(c) != "Mn"
    )


# ============================================================
# Heuristique : faut-il chercher sur le web ? (gratuit, instantane)
# ============================================================
def faut_il_chercher(question):
    q = _sans_accents(question.lower())
    if any(mot in q for mot in MOTS_DECLENCHEURS):
        return question   # on cherche, en utilisant la question comme requete
    return None           # sinon, pas de recherche


# ============================================================
# Recherche Tavily -> bloc de contexte texte
# ============================================================
def chercher_web(requete):
    try:
        res = tavily.search(

            query=requete,
            max_results=7,
            include_answer=True,  
            search_depth="basic"
             )
        morceaux = []
        for r in res.get("results", []):
            morceaux.append(
                f"- {r.get('title', '')}\n  Source : {r.get('url', '')}\n  {r.get('content', '')}"
            )
        if morceaux:
            return "\n\n".join(morceaux)
    except Exception as e:
        print("Recherche Tavily echouee :", repr(e))
    return None


@app.route("/")
def home():
    return "Backend OK"


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    aujourdhui = date.today().strftime("%d/%m/%Y")
    info_date = f"Nous sommes aujourd'hui le {aujourdhui}. Tiens-en compte pour toute question de date ou d'actualite."
 
    # --- On donne la date du jour au modele sur CHAQUE message ---
    # (on l'ajoute au message systeme existant, ou on en cree un)
    messages_finaux = []
    date_ajoutee = False
    for m in messages:
        if m.get("role") == "system" and not date_ajoutee:
            messages_finaux.append({
                "role": "system",
                "content": m.get("content", "") + "\n\n" + info_date,
            })
            date_ajoutee = True
        else:
            messages_finaux.append(dict(m))
    if not date_ajoutee:
        messages_finaux.insert(0, {"role": "system", "content": info_date})

    # Derniere question de l'utilisateur
    question = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            question = m.get("content", "")
            break

    # 1) Heuristique -> 2) recherche si besoin
    contexte = None
    requete = faut_il_chercher(question)
    if requete:
        print("Recherche web :", requete)
        contexte = chercher_web(requete)

    # 3) On injecte le contexte web dans la derniere question utilisateur
    messages_finaux = list(messages)
    if contexte and messages_finaux:
        for i in range(len(messages_finaux) - 1, -1, -1):
            if messages_finaux[i].get("role") == "user":
                question_originale = messages_finaux[i]["content"]
                messages_finaux[i] = {
                    "role": "user",
                    "content": (
                        "Resultats de recherche web recents (utilise-les en priorite pour repondre, "
                        "et cite les sources / URLs quand c'est pertinent) :\n\n"
                        + contexte
                        + "\n\n---\nQuestion : "
                        + question_originale
                    ),
                }
                break

    # 4) Reponse finale en streaming
    def generate():
        max_essais = 4

        for essai in range(max_essais):
            try:
                stream = client.chat.completions.create(
                    model=MODELE,
                    messages=messages_finaux,
                    temperature=0.1,
                    reasoning_effort="none",   # pas de "thinking" -> plus rapide
                    stream=True
                )

                got_text = False
                for chunk in stream:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        got_text = True
                        yield delta

                # Reponse vide (souvent : filtre de securite de Gemini)
                if not got_text:
                    yield "[Reponse vide - probablement bloquee par le filtre de securite. Reformule ou adoucis le system prompt.]"

                return  # succes -> on sort

            except RateLimitError:
                print("ERREUR /chat : quota gratuit depasse (429).")
                yield "[Quota gratuit du jour epuise pour ce modele. Reessaie demain, ou passe a un autre modele.]"
                return

            except ERREURS_TEMPORAIRES as e:
                print(f"Tentative {essai + 1}/{max_essais} echouee : {type(e).__name__}")
                if essai < max_essais - 1:
                    time.sleep(2 ** essai)   # backoff : 1s, 2s, 4s...
                else:
                    yield "[Gemini ne repond pas (timeout ou surcharge). Reessaie dans un instant, et verifie ta connexion.]"

            except Exception as e:
                print("ERREUR /chat :", repr(e))
                yield f"[Erreur serveur : {e}]"
                return

    return Response(stream_with_context(generate()), mimetype="text/plain")


if __name__ == "__main__":
    app.run(debug=True, port=5000)