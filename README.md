# 🎤 RAPBOT — Chatbot Spécialisé en Rap

> Un chatbot intelligent dédié à l'univers du rap — artistes, albums, actus et culture hip-hop.

![Interface RAPBOT](screenshot.png)

---

## ✨ Fonctionnalités

- 💬 **Chat en temps réel** avec un assistant spécialisé en rap
- 🔍 **Recherche d'actus** grâce à l'API Tavily (informations récentes sur les artistes)
- 🤖 **Réponses intelligentes** propulsées par l'API OpenAI
- 🆕 **Nouvelle discussion** en un clic avec le bouton "NOUVEAU"
- 🌙 **Mode sombre / clair** intégré

---

## 🛠️ Tech Stack

| Côté | Technologie |
|------|-------------|
| Frontend | React + Vite |
| Backend | Python Flask |
| IA | OpenAI API (GPT) |
| Recherche web | Tavily API |

---

## 📁 Structure du projet

```
RAPBOT---Chatbot-Rap/
├── backchat/               # Backend Flask
│   ├── app.py              # Serveur principal
│   ├── requirements.txt    # Dépendances Python
│   └── .env.example        # Variables d'environnement (modèle)
└── frontchat/              # Frontend React
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── Footer.jsx
    │   └── main.jsx
    ├── public/
    ├── index.html
    └── package.json
```

---

## ⚙️ Installation

### Prérequis
- Python 3.10+
- Node.js 18+
- Une clé API [OpenAI](https://platform.openai.com/)
- Une clé API [Tavily](https://tavily.com/)

---

### Backend (Flask)

```bash
cd backchat

# Créer et activer l'environnement virtuel
python -m venv envchatbot
source envchatbot/Scripts/activate   # Windows Git Bash
# ou
source envchatbot/bin/activate       # Linux / Mac

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Ouvre .env et remplis tes clés API

# Lancer le serveur
python app.py
```

---

### Frontend (React)

```bash
cd frontchat

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

---

## 🔑 Variables d'environnement

Crée un fichier `.env` dans le dossier `backchat/` en te basant sur `.env.example` :

```env
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here
```

> ⚠️ Ne jamais commiter le fichier `.env` — il est ignoré par `.gitignore`.

---

## 👤 Auteur

**Aghiles Ait Belkacem** — [@aghilesaitbelkacem-lab](https://github.com/aghilesaitbelkacem-lab)
